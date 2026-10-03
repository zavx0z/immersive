/**
Шапка поверхности с безымянным слотом содержимого.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiSurfacesChromeHeader as Contract} from "./contract"

export type {UiSurfacesChromeHeader} from "./contract"


export default function SurfaceHeader(props: Contract.Input): Contract.Output {
  return <header
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      height: 28px;
      gap: 4px;
      padding: 3px 6px;
      background: var(--space-node-header-background);

      ${props.style}
    `}
  >
    <slot />
  </header>
}
