import { Context, createContext, useContext } from 'solid-js';
import { render, screen, waitFor } from 'solid-testing-library';

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient
} from '..';
import { createQueryClient, queryKey, sleep } from '../../../../tests/utils';

describe('QueryClientProvider', () => {
  test('sets a specific cache for all queries to use', async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({ queryCache })

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    render(
      () => <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    await waitFor(() => screen.getByText('test'))

    expect(queryCache.find(key)).toBeDefined()
  })

  test('allows multiple caches to be partitioned', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const queryCache1 = new QueryCache()
    const queryCache2 = new QueryCache()

    const queryClient1 = createQueryClient({ queryCache: queryCache1 })
    const queryClient2 = createQueryClient({ queryCache: queryCache2 })

    function Page1() {
      const { data } = useQuery(key1, async () => {
        await sleep(10)
        return 'test1'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }
    function Page2() {
      const { data } = useQuery(key2, async () => {
        await sleep(10)
        return 'test2'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    render(() =>
      <>
        <QueryClientProvider client={queryClient1}>
          <Page1 />
        </QueryClientProvider>
        <QueryClientProvider client={queryClient2}>
          <Page2 />
        </QueryClientProvider>
      </>,
    )

    await waitFor(() => screen.getByText('test1'))
    await waitFor(() => screen.getByText('test2'))

    expect(queryCache1.find(key1)).toBeDefined()
    expect(queryCache1.find(key2)).not.toBeDefined()
    expect(queryCache2.find(key1)).not.toBeDefined()
    expect(queryCache2.find(key2)).toBeDefined()
  })

  test("uses defaultOptions for queries when they don't provide their own config", async () => {
    const key = queryKey()

    const queryCache = new QueryCache()
    const queryClient = createQueryClient({
      queryCache,
      defaultOptions: {
        queries: {
          cacheTime: Infinity,
        },
      },
    })

    function Page() {
      const { data } = useQuery(key, async () => {
        await sleep(10)
        return 'test'
      })

      return (
        <div>
          <h1>{data}</h1>
        </div>
      )
    }

    render(() =>
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    )

    await waitFor(() => screen.getByText('test'))

    expect(queryCache.find(key)).toBeDefined()
    expect(queryCache.find(key)?.options.cacheTime).toBe(Infinity)
  })

  describe('with custom context', () => {
    it('uses the correct context', async () => {
      const key = queryKey()

      const contextOuter = createContext<QueryClient | undefined>(
        undefined,
      )
      const contextInner = createContext<QueryClient | undefined>(
        undefined,
      )

      const queryCacheOuter = new QueryCache()
      const queryClientOuter = new QueryClient({ queryCache: queryCacheOuter })

      const queryCacheInner = new QueryCache()
      const queryClientInner = new QueryClient({ queryCache: queryCacheInner })

      const queryCacheInnerInner = new QueryCache()
      const queryClientInnerInner = new QueryClient({
        queryCache: queryCacheInnerInner,
      })

      function Page() {
        const { data: testOuter } = useQuery(key, async () => 'testOuter', {
          context: contextOuter,
        })
        const { data: testInner } = useQuery(key, async () => 'testInner', {
          context: contextInner,
        })
        const { data: testInnerInner } = useQuery(
          key,
          async () => 'testInnerInner',
        )

        return (
          <div>
            <h1>
              {testOuter} {testInner} {testInnerInner}
            </h1>
          </div>
        )
      }

      // contextSharing should be ignored when passing a custom context.
      const contextSharing = true

      render(() =>
        <QueryClientProvider client={queryClientOuter} context={contextOuter}>
          <QueryClientProvider client={queryClientInner} context={contextInner}>
            <QueryClientProvider
              client={queryClientInnerInner}
              contextSharing={contextSharing}
            >
              <Page />
            </QueryClientProvider>
          </QueryClientProvider>
        </QueryClientProvider>,
      )

      await waitFor(() =>
        screen.getByText('testOuter testInner testInnerInner'),
      )
    })
  })

  describe('useQueryClient', () => {
    test('should throw an error if no query client has been set', () => {
      const consoleMock = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      function Page() {
        useQueryClient()
        return null
      }

      expect(() => render(() => <Page />)).toThrow(
        'No QueryClient set, use QueryClientProvider to set one',
      )

      consoleMock.mockRestore()
    })

    test('should use window to get the context when contextSharing is true', () => {
      const queryCache = new QueryCache()
      const queryClient = createQueryClient({ queryCache })

      let queryClientFromHook: QueryClient | undefined
      let queryClientFromWindow: QueryClient | undefined

      function Page() {
        queryClientFromHook = useQueryClient()
        queryClientFromWindow = useContext(
          window.SolidQueryClientContext as Context<
            QueryClient | undefined
          >,
        )
        return null
      }

      render(() =>
        <QueryClientProvider client={queryClient} contextSharing={true}>
          <Page />
        </QueryClientProvider>,
      )

      expect(queryClientFromHook).toEqual(queryClient)
      expect(queryClientFromWindow).toEqual(queryClient)
    })

    // TODO(lukemurray): implement server side tests
    // test('should not use window to get the context when contextSharing is true and window does not exist', () => {
    //   const queryCache = new QueryCache()
    //   const queryClient = createQueryClient({ queryCache })

    //   // Mock a non web browser environment
    //   const windowSpy = jest
    //     .spyOn(window, 'window', 'get')
    //     .mockImplementation(undefined)

    //   let queryClientFromHook: QueryClient | undefined

    //   function Page() {
    //     queryClientFromHook = useQueryClient()
    //     return null
    //   }

    //   renderToString(
    //     <QueryClientProvider client={queryClient} contextSharing={true}>
    //       <Page />
    //     </QueryClientProvider>,
    //   )

    //   expect(queryClientFromHook).toEqual(queryClient)

    //   windowSpy.mockRestore()
    // })
  })
})