import {createContext, useContext, useDocument, useLayoutEffect, useRef, useSyncExternalStore} from "@zavx0z/immersive-component"
import {documentEnvironment} from "./document-environment.ts"
import type {RootEnvironment, RootState, FrameCallback} from "./document-environment.ts"
export type {RootSize, RootState, FrameState, FrameCallback, FrameLoop} from "./document-environment.ts"

export const rootContext = createContext<RootEnvironment | null>(null)

/**
Подписывает компонент на выбранную часть состояния его подключения.

Результат селектора сравнивается через `Object.is`. Для составного результата
нужно сохранять ссылку, пока его данные не изменились. Обычный контекст остаётся
стабильным: изменение размера не вызывает повторное выполнение всего App.

@throws Error При вызове вне App, смонтированного через Browser `createRoot`.
@example
```tsx
const size = useSpace(state => state.size)
```
*/
export function useSpace<Selection>(selector: (state: RootState) => Selection): Selection {
  const environment = useRootEnvironment()
  return useSyncExternalStore(environment.subscribe, () => selector(environment.read()))
}

/**
Вызывает callback перед расчётом и рисованием общего кадра.

`delta` — время с предыдущего кадра в секундах, для первого кадра равно нулю.
В режиме `demand` подписка сама не запускает непрерывную анимацию: для неё
выберите `always` либо запросите следующий кадр через `state.invalidate()`.
Изменяйте нужные semantic Elements через refs; обновление состояния компонентов
на каждом кадре не требуется. При размонтировании подписка снимается автоматически.

@throws Error При вызове вне App, смонтированного через Browser `createRoot`.
@example
```tsx
useFrame((_state, delta) => {
  if (object.current) object.current.z += delta * 100
})
```
*/
export function useFrame(callback: FrameCallback): void {
  const environment = useRootEnvironment()
  const latest = useRef(callback)
  latest.current = callback
  useLayoutEffect(() => environment.subscribeFrame((state, delta) => latest.current(state, delta)), [environment])
}

function useRootEnvironment(): RootEnvironment {
  const value = useContext(rootContext)
  const document = useDocument()
  const environment = value ?? documentEnvironment(document)
  if (environment === null) throw new Error("Browser hooks require a connected Document")
  return environment
}
