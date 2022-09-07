import { QueryClient } from '@tanstack/query-core'
import {
  Context as SolidContext,
  createComputed,
  createContext,
  mergeProps,
  onCleanup, ParentProps,
  useContext
} from 'solid-js'
import { ContextOptions } from './types'

declare global {
  interface Window {
    SolidQueryClientContext?: SolidContext<QueryClient | undefined>
  }
}

export const defaultContext = createContext<QueryClient | undefined>(undefined)
const QueryClientSharingContext = createContext<boolean>(false)

// If we are given a context, we will use it.
// Otherwise, if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if Solid Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.
function getQueryClientContext(
  context: SolidContext<QueryClient | undefined> | undefined,
  contextSharing: boolean,
) {
  if (context) {
    return context
  }
  if (contextSharing && typeof window !== 'undefined') {
    if (!window.SolidQueryClientContext) {
      window.SolidQueryClientContext = defaultContext
    }

    return window.SolidQueryClientContext
  }

  return defaultContext
}

export const useQueryClient = ({ context }: ContextOptions = {}) => {
  const queryClient = useContext(
    getQueryClientContext(context, useContext(QueryClientSharingContext)),
  )

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return queryClient
}

type QueryClientProviderPropsBase = ParentProps & {
  client: QueryClient
}
type QueryClientProviderPropsWithContext = ContextOptions & {
  contextSharing?: never
} & QueryClientProviderPropsBase
type QueryClientProviderPropsWithContextSharing = {
  context?: never
  contextSharing?: boolean
} & QueryClientProviderPropsBase

export type QueryClientProviderProps =
  | QueryClientProviderPropsWithContext
  | QueryClientProviderPropsWithContextSharing

export const QueryClientProvider = (props: QueryClientProviderProps) => {
  const mergedProps = mergeProps({contextSharing: false}, props)

  createComputed(() => {
    mergedProps.client.mount()
    onCleanup(() => mergedProps.client.unmount())
  })

  const Context = getQueryClientContext(mergedProps.context, mergedProps.contextSharing!)

  return (
    <QueryClientSharingContext.Provider value={!mergedProps.context && mergedProps.contextSharing}>
      <Context.Provider value={mergedProps.client}>{mergedProps.children}</Context.Provider>
    </QueryClientSharingContext.Provider>
  )
}
