// CONTEXT

import { createContext, createSignal, useContext } from 'solid-js'
import type { JSX } from 'solid-js/types/jsx'

interface QueryErrorResetBoundaryValue {
  isReset: () => boolean
  clearReset: () => void
  reset: () => void
}

function createValue(): QueryErrorResetBoundaryValue {
  const [reset, setReset] = createSignal(false)
  return {
    isReset() {
      return reset()
    },
    reset() {
      setReset(true)
    },
    clearReset() {
      setReset(false)
    },
  }
}

// undefined as any to fool TS into thinking this is always defined.
const QueryErrorResetBoundaryContext =
  createContext<QueryErrorResetBoundaryValue>(createValue())

// HOOK

export const useQueryErrorResetBoundary = () =>
  useContext(QueryErrorResetBoundaryContext)

// COMPONENT

export interface QueryErrorResetBoundaryProps {
  children: ((value: QueryErrorResetBoundaryValue) => JSX.Element) | JSX.Element
}

export const QueryErrorResetBoundary = (
  props: QueryErrorResetBoundaryProps,
) => {
  const value: QueryErrorResetBoundaryValue = createValue()

  return (
    <QueryErrorResetBoundaryContext.Provider value={value}>
      {typeof props.children === 'function'
        ? (props.children as Function)(value)
        : props.children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}
