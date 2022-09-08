import { QueryFunction } from '@tanstack/query-core'
import { SolidQueryKey, UseQueryOptions } from './types'

export function shouldThrowError<T extends (...args: any[]) => boolean>(
  _useErrorBoundary: boolean | T | undefined,
  params: Parameters<T>,
): boolean {
  // Allow useErrorBoundary function to override throwing behavior on a per-error basis
  if (typeof _useErrorBoundary === 'function') {
    return _useErrorBoundary(...params)
  }

  return !!_useErrorBoundary
}

export function isQueryKey(value: unknown): value is SolidQueryKey {
  return typeof value === 'function'
}

export function parseQueryArgs<
  TOptions extends UseQueryOptions<any, any, any, TQueryKey>,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  arg1: TQueryKey | TOptions,
  arg2?: QueryFunction<any, ReturnType<TQueryKey>> | TOptions,
  arg3?: TOptions,
): TOptions {
  if (!isQueryKey(arg1)) {
    const { queryKey: solidKey, ...opts } = arg1 as any
    if (solidKey) {
      return {
        ...opts,
        queryKey: solidKey(),
      }
    }
    return arg1
  }

  if (typeof arg2 === 'function') {
    return { ...arg3, queryKey: arg1(), queryFn: arg2 } as TOptions
  }

  return { ...arg2, queryKey: arg1() } as TOptions
}
