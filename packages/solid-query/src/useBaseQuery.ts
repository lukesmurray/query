import {
  DefaultedQueryObserverOptions,
  notifyManager,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import {
  Accessor,
  createComputed,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { useIsRestoring } from './isRestoring'
import { useQueryClient } from './QueryClientProvider'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { UseBaseQueryOptions } from './types'

/**
 * Design of the base query.
 *
 * Exact copy of useBaseQuery from react-query, except for the following:
 *  - The observer result is saved in a Solid Store
 *  - When the observer changes the the result, the store is updated
 *  - We create a dummy resource which returns the result data from the store
 *    - We use this resource to trigger suspense
 *  - When the store is updated, we refetch the resource
 *  - We return a proxy object of the result, which maps the 'data' property to the resource
 *
 *  Differences
 *   - You cannot access the `data` property outside of a reactive scope.
 */

export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
) {
  const queryClient = useQueryClient({ context: options.context })
  const errorResetBoundary = useQueryErrorResetBoundary()

  const defaultedOptions = useDefaultedOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(options)

  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(queryClient, defaultedOptions())

  // use a store for the result, and set its initial value to an optimistic result.
  const [result, setResult] = createStore<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptions()),
  )

  // dummy resource wrapper around the observer state.
  // must be refetched when the state changes.
  const [dataResource, { refetch }] = createResource(() => {
    return new Promise((resolve, reject) => {
      if (result.isSuccess) {
        resolve(result.data)
      }
      if (result.isError && !result.isFetching) {
        throw result.error
      }
    })
  })

  // subscribe to observer changes.
  const unsubscribe = observer.subscribe((newResult) => {
    // update the result.
    setResult(newResult)
    // manually refetch the resource since the state changed.
    refetch()
  })

  // unsubscribe from observer changes on cleanup
  onCleanup(() => unsubscribe())

  onMount(() => {
    observer.setOptions(defaultedOptions(), { listeners: false })
  })

  createComputed(() => {
    observer.setOptions(defaultedOptions())
  })

  // TODO(lukemurray): not sure how to handle this
  // Handle suspense
  // if (
  //   defaultedOptions.suspense &&
  //   result.isLoading &&
  //   result.isFetching &&
  //   !isRestoring
  // ) {
  //   throw observer
  //     .fetchOptimistic(defaultedOptions)
  //     .then(({ data }) => {
  //       defaultedOptions.onSuccess?.(data as TData)
  //       defaultedOptions.onSettled?.(data, null)
  //     })
  //     .catch((error) => {
  //       errorResetBoundary.clearReset()
  //       defaultedOptions.onError?.(error)
  //       defaultedOptions.onSettled?.(undefined, error)
  //     })
  // }

  // TODO(lukemurray): not sure how to handle this
  // Handle error boundary
  // if (
  //   result.isError &&
  //   !errorResetBoundary.isReset() &&
  //   !result.isFetching &&
  //   shouldThrowError(defaultedOptions.useErrorBoundary, [
  //     result.error,
  //     observer.getCurrentQuery(),
  //   ])
  // ) {
  //   throw result.error
  // }

  // create a proxy result to return the data resource.
  const proxyResult = new Proxy(result, {
    get(target: typeof result, prop: keyof typeof result) {
      if (prop === 'data') {
        return dataResource()
      }
      return target[prop]
    },
  })

  // TODO(lukemurray): not sure if it is safe to use this.
  // // Handle result property usage tracking
  // return !defaultedOptions().notifyOnChangeProps
  //   ? observer.trackResult(proxyResult)
  //   : proxyResult
  return proxyResult
}

/**
 * Compute the default options for a query in a reactive scope.
 */
function useDefaultedOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
) {
  const queryClient = useQueryClient()
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()

  const [defaultedOptions, setDefaultedOptions] =
    createSignal<
      DefaultedQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >
    >()

  // // TODO(lukemurray): There is a bug here where the defaulted options are not
  // // updating reactively when the error reset boundary changes.
  // // If they did we would be able to see this console log.
  // createEffect(() => {
  //   const isReset = errorResetBoundary.isReset();
  //   console.log("reset changed", isReset);
  // })

  createComputed(() => {
    const newDefaultedOptions = queryClient.defaultQueryOptions(options)
    newDefaultedOptions._optimisticResults = isRestoring
      ? 'isRestoring'
      : 'optimistic'

    // Include callbacks in batch renders
    if (newDefaultedOptions.onError) {
      newDefaultedOptions.onError = notifyManager.batchCalls(
        newDefaultedOptions.onError,
      )
    }

    if (newDefaultedOptions.onSuccess) {
      newDefaultedOptions.onSuccess = notifyManager.batchCalls(
        newDefaultedOptions.onSuccess,
      )
    }

    if (newDefaultedOptions.onSettled) {
      newDefaultedOptions.onSettled = notifyManager.batchCalls(
        newDefaultedOptions.onSettled,
      )
    }

    if (newDefaultedOptions.suspense) {
      // Always set stale time when using suspense to prevent
      // fetching again when directly mounting after suspending
      if (typeof newDefaultedOptions.staleTime !== 'number') {
        newDefaultedOptions.staleTime = 1000
      }
    }

    const errorBoundaryIsReset = errorResetBoundary.isReset()
    if (newDefaultedOptions.suspense || newDefaultedOptions.useErrorBoundary) {
      // Prevent retrying failed query if the error boundary has not been reset yet
      if (!errorBoundaryIsReset) {
        newDefaultedOptions.retryOnMount = false
      }
    }

    setDefaultedOptions(newDefaultedOptions)
  })

  return defaultedOptions as Accessor<
    DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  >
}
