/**
Сохраняемая область содержимого поверхности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentSurfaceChromeBody as Contract} from "./contract"

export type {Zavx0zImmersiveUiComponentSurfaceChromeBody} from "./contract"


export default function SurfaceBody(props: Contract.Input): Contract.Output {
  return <section
    id={props.id}
    hidden={props.hidden === true}
    style={css`
      box-sizing: border-box;
      display: block;
      flex-grow: 1;
      padding: 6px;

      ${props.style}
    `}
  >
    <slot />
  </section>
}
