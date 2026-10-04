/**
Заголовок или дополнительная подпись поверхности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {Zavx0zImmersiveUiComponentSurfaceChromeTitle as Contract} from "./contract"

export type {Zavx0zImmersiveUiComponentSurfaceChromeTitle} from "./contract"


export default function SurfaceTitle(props: Contract.Input): Contract.Output {
  const variant = props.variant ?? "title"
  return <span
    style={css`
      display: inline;

      ${variant === "title" && css`
        min-width: 0;
        flex-grow: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: var(--font-size-sm);
      `}

      ${variant === "subtitle" && css`
        color: var(--widget-text-content-readonly);
        font-size: var(--font-size-2xs);
      `}

      ${props.style}
    `}
  >
    {props.text}
  </span>
}
