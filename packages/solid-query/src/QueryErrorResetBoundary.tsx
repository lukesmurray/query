// CONTEXT

import { createContext, useContext } from 'solid-js';
import type { JSX } from "solid-js/types/jsx";

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
    | ((value: QueryErrorResetBoundaryValue) => JSX.Element)
    | JSX.Element;
}


export const QueryErrorResetBoundary = ({
  children,
}: QueryErrorResetBoundaryProps) => {
  const value = createValue();
  return (
    <QueryErrorResetBoundaryContext.Provider value={value}>
      {typeof children === 'function'
        ? (children as Function)(value)
        : children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}
