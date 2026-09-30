/**
Заголовок или дополнительная подпись поверхности.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SurfaceTitleProps} from "./contract/input.ts"

export type {SurfaceTitleProps} from "./contract/input"

import type {JSX} from "@jsx-compiler/session"

export default function SurfaceTitle(props: SurfaceTitleProps): JSX.Element {
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
