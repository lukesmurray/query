import { render } from 'solid-testing-library'
import { ContextOptions, QueryClient, QueryClientProvider } from '..'
import { setActTimeout } from '../../../../tests/utils'

export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
  options: ContextOptions = {},
): ReturnType<typeof render> {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client} context={options.context}>
      {ui}
    </QueryClientProvider>,
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      rerender(
        <QueryClientProvider client={client} context={options.context}>
          {rerenderUi}
        </QueryClientProvider>,
      ),
  } as any
}

export const Blink = ({
  duration,
  children,
}: {
  duration: number
  children: React.ReactNode
}) => {
  const [shouldShow, setShouldShow] = React.useState<boolean>(true)

  React.useEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), duration)
    return () => {
      clearTimeout(timeout)
    }
  }, [duration, children])

  return shouldShow ? <>{children}</> : <>off</>
}
