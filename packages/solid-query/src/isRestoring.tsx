import { createContext, useContext } from 'solid-js'

const IsRestoringContext = createContext(false)

export const useIsRestoring = () => useContext(IsRestoringContext)
export const IsRestoringProvider = IsRestoringContext.Provider
