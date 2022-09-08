import { createEffect, createSignal, ErrorBoundary, Suspense } from 'solid-js'
import { fireEvent, waitFor } from 'solid-testing-library'

import { screen } from 'solid-testing-library'
import { QueryCache, QueryErrorResetBoundary, useQuery } from '..'
import { createQueryClient, queryKey, sleep } from '../../../../tests/utils'
import { renderWithClient } from './utils'

// TODO: This should be removed with the types for react-error-boundary get updated.
declare module 'react-error-boundary' {
  interface ErrorBoundaryPropsWithFallback {
    children: any
  }
}

describe('QueryErrorResetBoundary', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  // TODO(lukemurray): this test should pass but I can't get the useBaseQuery to
  // update when the QueryErrorResetBoundary is reset. See relevant comment
  // in useBaseQuery.ts
  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const query = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        },
      )
      return <div>{query.data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })

  it('should not throw error if query is disabled', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const query = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          enabled: !succeed,
          useErrorBoundary: true,
        },
      )
      return (
        <div>
          <div>status: {query.status}</div>
          <div>{query.data}</div>
        </div>
      )
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('status: error'))
  })

  it('should not throw error if query is disabled, and refetch if query becomes enabled again', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          enabled: enabled(),
          useErrorBoundary: true,
        },
      )

      createEffect(() => {
        setEnabled(true)
      })

      return <div>{data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })

  it('should throw error if query is disabled and manually refetched', async () => {
    const key = queryKey()

    function Page() {
      const { data, refetch, status, fetchStatus } = useQuery<string>(
        key,
        async () => {
          throw new Error('Error')
        },
        {
          retry: false,
          enabled: false,
          useErrorBoundary: true,
        },
      )

      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          <div>
            status: {status}, fetchStatus: {fetchStatus}
          </div>
          <div>{data}</div>
        </div>
      )
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('status: loading, fetchStatus: idle'))
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should not retry fetch if the reset error boundary has not been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        },
      )
      return <div>{data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {() => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should retry fetch if the reset error boundary has been reset and the query contains data from a previous fetch', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
          initialData: 'initial',
        },
      )
      return <div>{data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })

  it('should not retry fetch if the reset error boundary has not been reset after a previous reset', async () => {
    const key = queryKey()

    let succeed = false
    let shouldReset = true

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        },
      )
      return <div>{data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    if (shouldReset) {
                      resetQuery()
                      resetSolid()
                    }
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    shouldReset = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    succeed = true
    shouldReset = false
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should throw again on error after the reset error boundary has been reset', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const { data } = useQuery<string>(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          throw new Error('Error')
        },
        {
          retry: false,
          useErrorBoundary: true,
        },
      )
      return <div>{data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    expect(fetchCount).toBe(3)
  })

  it('should never render the component while the query is in error state', async () => {
    const key = queryKey()
    let fetchCount = 0
    let renders = 0

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          if (fetchCount > 2) {
            return 'data'
          } else {
            throw new Error('Error')
          }
        },
        {
          retry: false,
          suspense: true,
        },
      )
      renders++
      return <div>{data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Suspense fallback={<div>loading</div>}>
              <Page />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
    expect(fetchCount).toBe(3)
    expect(renders).toBe(1)
  })

  it('should render children', async () => {
    function Page() {
      return (
        <div>
          <span>page</span>
        </div>
      )
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        <Page />
      </QueryErrorResetBoundary>,
    )

    expect(screen.queryByText('page')).not.toBeNull()
  })

  it('should show error boundary when using tracked queries even though we do not track the error field', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        },
      )
      return <div>{data}</div>
    }

    renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset: resetQuery }) => (
          <ErrorBoundary
            fallback={(err, resetSolid) => (
              <div>
                <div>error boundary</div>
                <button
                  onClick={() => {
                    resetQuery()
                    resetSolid()
                  }}
                >
                  retry
                </button>
              </div>
            )}
          >
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })
})
