/**
Кнопка управления поверхностью с единым размером и доступностью.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SurfaceButtonProps} from "./contract/input.ts"
import Button from "@ui-buttons/button"

export type {SurfaceButtonProps} from "./contract/input"

import type {JSX} from "@jsx-compiler/session"

export default function SurfaceButton(props: SurfaceButtonProps): JSX.Element {
  return <Button
    label={props.label}
    iconSrc={props.iconSrc}
    iconOnly={props.iconOnly}
    title={props.title}
    aria-label={props.ariaLabel}
    aria-expanded={props.expanded}
    aria-controls={props.controls}
    disabled={props.disabled}
    style={css`
      width: 52px;
      min-width: 22px;
      height: 22px;
      padding: 2px 6px;
      font-size: 10px;

      ${props.iconAction === true && css`
        width: 22px;
        padding: 2px;
      `}

      ${props.style}
    `}
    onClick={props.onClick}
  />
}
