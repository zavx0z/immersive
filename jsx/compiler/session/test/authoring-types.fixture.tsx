import type {JSX} from "@jsx-compiler/session"
import {memo, createRoot} from "@zavx0z/component"
import {createDocument} from "@zavx0z/dom"

/** Native semantic fixture проверяет типы автора; этот TSX не исполняется без compiler. */
export function Child() {
  return <button>Содержимое</button>
}

/** Контракт получателя независим от его props. */
interface Slots {
  default: typeof Child
}

/** Generic авторский Element сохраняет контракт в объявлении компонента. */
export function Receiver(): JSX.Element<Slots> {
  return <slot />
}

const MemoReceiver = memo(Receiver)

/** Native expression не переносит свободный generic из namespace в свой тип. */
export function App(): JSX.Element {
  return (
    <MemoReceiver>
      <Child />
    </MemoReceiver>
  )
}

if (false) {
  const owner = createDocument().createElement("div")
  const root = createRoot(owner)
  root.render(
    <Receiver>
      <Child />
    </Receiver>
  )
  root.render(
    <App />
  )
  // @ts-expect-error Бренд авторского Element является обязательным.
  const missingElementBrand: JSX.Element = {}
  // @ts-expect-error Принимающие области образуют объектный контракт.
  const nonObjectContract: JSX.Element<string> = {"@zavx0z/jsx/element": true}
}
