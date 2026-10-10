import {memo as remember, useEffect, useState as state} from "@zavx0z/immersive/XReact"
import {createRoot as createCanvasRoot, useFrame as frame, useSpace as space} from "@zavx0z/immersive/XReact/browser"

function Header() {
  const [label] = state("Заголовок")
  useEffect(() => {
    document.title = label
  }, [label])
  return <h1 style={css`
    color: red;
  `}>{label}</h1>
}

function Panel() {
  return <section>
    <slot name="header" />
  </section>
}

const MemoPanel = remember(Panel)

export function PublicApp() {
  const currentSpace = space(state => state)
  frame(() => {})
  return <MemoPanel>
    <Header slot="header" />
  </MemoPanel>
}

export function connect(canvas: HTMLCanvasElement) {
  createCanvasRoot(canvas).render(<PublicApp />)
}
