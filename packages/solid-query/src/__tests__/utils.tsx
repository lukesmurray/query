import {
  createEffect,
  createSignal,
  onCleanup,
  ParentProps,
  Show,
} from 'solid-js'
import type { JSX } from 'solid-js/types/jsx'
import { render } from 'solid-testing-library'
import { ContextOptions, QueryClient, QueryClientProvider } from '..'

export function renderWithClient(
  client: QueryClient,
  ui: JSX.Element,
  options: ContextOptions = {},
): ReturnType<typeof render> {
  const { rerender, ...result } = render(() => (
    <QueryClientProvider client={client} context={options.context}>
      {ui}
    </QueryClientProvider>
  ))
  return {
    ...result,
    rerender: (rerenderUi: JSX.Element) =>
      // TODO(lukemurray): this doesn't exist in solid-testing-library
      rerender!(() => (
        <QueryClientProvider client={client} context={options.context}>
          {rerenderUi}
        </QueryClientProvider>
      )),
  } as any
}

export const Blink = (
  props: ParentProps & {
    duration: number
  },
) => {
  const [shouldShow, setShouldShow] = createSignal<boolean>(true)

  createEffect(() => {
    setShouldShow(true)
    const timeout = setTimeout(() => setShouldShow(false), props.duration)
    onCleanup(() => clearTimeout(timeout))
  })

  return (
    <Show when={shouldShow} fallback={<>off</>}>
      {props.children}
    </Show>
  )
}
