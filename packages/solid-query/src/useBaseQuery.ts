import {
  notifyManager,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import { createEffect, createResource, onCleanup } from 'solid-js'
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
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = queryClient.defaultQueryOptions(options)

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  // Include callbacks in batch renders
  if (defaultedOptions.onError) {
    defaultedOptions.onError = notifyManager.batchCalls(
      defaultedOptions.onError,
    )
  }

  if (defaultedOptions.onSuccess) {
    defaultedOptions.onSuccess = notifyManager.batchCalls(
      defaultedOptions.onSuccess,
    )
  }

  if (defaultedOptions.onSettled) {
    defaultedOptions.onSettled = notifyManager.batchCalls(
      defaultedOptions.onSettled,
    )
  }

  if (defaultedOptions.suspense) {
    // Always set stale time when using suspense to prevent
    // fetching again when directly mounting after suspending
    if (typeof defaultedOptions.staleTime !== 'number') {
      defaultedOptions.staleTime = 1000
    }
  }

  if (defaultedOptions.suspense || defaultedOptions.useErrorBoundary) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!errorResetBoundary.isReset()) {
      defaultedOptions.retryOnMount = false
    }
  }

  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(queryClient, defaultedOptions)

  // use a store for the result, and set its initial value to an optimistic result.
  const [result, setResult] = createStore<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptions),
  )

  // dummy resource wrapper around the observer state.
  // must be refetched when the state changes.
  const [dataResource, { refetch }] = createResource(() => {
    return new Promise((resolve, reject) => {
      // if the query is done, resolve it.
      if (result.isSuccess) resolve(result.data)
      // if the query is in an error state, reject it.
      if (result.isError && !result.isFetching) {
        reject(result.error)
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

  createEffect(() => {
    errorResetBoundary.clearReset()
  })

  createEffect(() => {
    const newDefaultedOptions = queryClient.defaultQueryOptions(options)
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(newDefaultedOptions, { listeners: false })
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

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(proxyResult)
    : proxyResult
}
