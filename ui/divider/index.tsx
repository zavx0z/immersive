/**
Разделитель соседних областей интерфейса.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {DividerProps} from "./contract/input.ts"

export type {DividerProps} from "./contract/input"
export type {DividerVariant} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function Divider(props: DividerProps): JSX.Element {
  const variant = props.variant ?? "full-width"
  return <hr
    title={props.title}
    data-variant={variant}
    style={css`
      box-sizing: border-box;
      display: block;
      width: 100%;
      height: 1px;
      margin: 4px 0;
      border: 0;
      background: var(--material-editor-border);

      &[data-variant="inset"] {
        width: 96%;
        margin-left: 16px;
      }

      &[data-variant="middle"] {
        width: 90%;
        margin-left: 16px;
      }

      ${props.style}
    `}
  />
}
