// CONTEXT

// TODO(lukemurray): we might be able to rewrite this using solid context

import { createContext, createSignal, useContext } from "solid-js"

interface QueryErrorResetBoundaryValue {
  clearReset: () => void
  isReset: () => boolean
  reset: () => void
}

function createValue(): QueryErrorResetBoundaryValue {
  let isReset = false
  return {
    clearReset: () => {
      isReset = false
    },
    reset: () => {
      isReset = true
    },
    isReset: () => {
      return isReset
    },
  }
}

const QueryErrorResetBoundaryContext = createContext(createValue())

// HOOK

export const useQueryErrorResetBoundary = () =>
  useContext(QueryErrorResetBoundaryContext)

// COMPONENT

export interface QueryErrorResetBoundaryProps {
  children:
    | ((value: QueryErrorResetBoundaryValue) => React.ReactNode)
    | React.ReactNode
}

export const QueryErrorResetBoundary = ({
  children,
}: QueryErrorResetBoundaryProps) => {
  const [value] = createSignal(createValue())
  return (
    <QueryErrorResetBoundaryContext.Provider value={value()}>
      {typeof children === 'function'
        ? (children as Function)(value)
        : children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}
