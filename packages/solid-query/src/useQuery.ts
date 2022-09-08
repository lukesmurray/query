import { QueryFunction, QueryObserver } from '@tanstack/query-core'
import {
  DefinedUseQueryResult,
  SolidQueryKey,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import { useBaseQuery } from './useBaseQuery'
import { parseQueryArgs } from './utils'

// HOOK

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'initialData'
  > & { initialData?: () => undefined },
): UseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'initialData'
  > & { initialData: TQueryFnData | (() => TQueryFnData) },
): DefinedUseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  queryKey: TQueryKey,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'initialData'
  > & { initialData?: () => undefined },
): UseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  queryKey: TQueryKey,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'initialData'
  > & { initialData: TQueryFnData | (() => TQueryFnData) },
): DefinedUseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  queryKey: TQueryKey,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  >,
): UseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, ReturnType<TQueryKey>>,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'initialData'
  > & { initialData?: () => undefined },
): UseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, ReturnType<TQueryKey>>,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'initialData'
  > & { initialData: TQueryFnData | (() => TQueryFnData) },
): DefinedUseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, ReturnType<TQueryKey>>,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends SolidQueryKey = SolidQueryKey,
>(
  arg1: TQueryKey | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?:
    | QueryFunction<TQueryFnData, ReturnType<TQueryKey>>
    | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg3?: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(parsedOptions, QueryObserver)
}
