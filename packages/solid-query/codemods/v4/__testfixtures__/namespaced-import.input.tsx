import * as SQ from 'solid-query'

export const Examples = () => {
  SQ.useQuery('todos')
  SQ.useInfiniteQuery('todos')
  SQ.useMutation('todos')
  SQ.useIsFetching('todos')
  SQ.useIsMutating('todos')
  SQ.useQueries([query1, query2])
  // QueryClient methods
  // --- Instantiated hook call.
  const queryClient = SQ.useQueryClient()
  queryClient.getMutationDefaults('todos')
  queryClient.getQueriesData('todos')
  queryClient.getQueryData('todos')
  queryClient.getQueryDefaults('todos')
  queryClient.getQueryState('todos')
  queryClient.isFetching('todos')
  queryClient.setMutationDefaults('todos', { mutationFn: async () => null })
  queryClient.setQueriesData('todos', () => null)
  queryClient.setQueryData('todos', () => null)
  queryClient.setQueryDefaults('todos', { queryFn: async () => null })
  queryClient.cancelQueries('todos')
  queryClient.fetchInfiniteQuery('todos')
  queryClient.fetchQuery('todos')
  queryClient.invalidateQueries('todos')
  queryClient.prefetchInfiniteQuery('todos')
  queryClient.prefetchQuery('todos')
  queryClient.refetchQueries('todos')
  queryClient.removeQueries('todos')
  queryClient.resetQueries('todos')
  // --- Direct hook call.
  SQ.useQueryClient().getMutationDefaults('todos')
  SQ.useQueryClient().getQueriesData('todos')
  SQ.useQueryClient().getQueryData('todos')
  SQ.useQueryClient().getQueryDefaults('todos')
  SQ.useQueryClient().getQueryState('todos')
  SQ.useQueryClient().isFetching('todos')
  SQ.useQueryClient().setMutationDefaults('todos', {
    mutationFn: async () => null,
  })
  SQ.useQueryClient().setQueriesData('todos', () => null)
  SQ.useQueryClient().setQueryData('todos', () => null)
  SQ.useQueryClient().setQueryDefaults('todos', {
    queryFn: async () => null,
  })
  SQ.useQueryClient().cancelQueries('todos')
  SQ.useQueryClient().fetchInfiniteQuery('todos')
  SQ.useQueryClient().fetchQuery('todos')
  SQ.useQueryClient().invalidateQueries('todos')
  SQ.useQueryClient().prefetchInfiniteQuery('todos')
  SQ.useQueryClient().prefetchQuery('todos')
  SQ.useQueryClient().refetchQueries('todos')
  SQ.useQueryClient().removeQueries('todos')
  SQ.useQueryClient().resetQueries('todos')
  // QueryCache
  // --- NewExpression
  const queryCache1 = new SQ.QueryCache({
    onError: (error) => console.log(error),
    onSuccess: (success) => console.log(success)
  })
  queryCache1.find('todos')
  queryCache1.findAll('todos')
  // --- Instantiated hook call.
  const queryClient1 = SQ.useQueryClient()
  queryClient1.getQueryCache().find('todos')
  queryClient1.getQueryCache().findAll('todos')
  //
  const queryClient2 = new SQ.QueryClient({})
  queryClient2.getQueryCache().find('todos')
  queryClient2.getQueryCache().findAll('todos')
  //
  const queryCache2 = queryClient1.getQueryCache()
  queryCache2.find('todos')
  queryCache2.findAll('todos')
  // --- Direct hook call.
  SQ.useQueryClient().getQueryCache().find('todos')
  SQ.useQueryClient().getQueryCache().findAll('todos')
  //
  const queryCache3 = SQ.useQueryClient().getQueryCache()
  queryCache3.find('todos')
  queryCache3.findAll('todos')

  return <div>Example Component</div>
}
