/**
Поверхность содержимого с вариантом оформления и безымянным слотом.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {PaneProps} from "./contract/input.ts"
import {hasSlot} from "@zavx0z/component/slot-presence"

export type {PaneProps} from "./contract/input"
export type {PaneVariant, PaneTextContent} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function Pane(props: PaneProps): JSX.Element {
  if (hasSlot() && props.content != null) {
    throw new Error("Pane accepts either slot content or primitive content, not both")
  }
  const variant = props.variant ?? "filled"
  return <section
    title={props.title}
    data-variant={variant}
    data-active={props.active === true ? "true" : undefined}
    style={css`
      box-sizing: border-box;
      display: block;
      min-width: 0;
      padding: 8px;
      overflow: hidden;
      border: 1px solid var(--widget-box-outline);
      border-radius: 4px;
      background: var(--widget-box-background);
      color: var(--widget-box-content);

      &[data-variant="outlined"] {
        background: transparent;
      }

      &[data-variant="transparent"] {
        border-color: transparent;
        background: transparent;
      }

      &[data-active="true"] {
        border-color: var(--material-editor-outline-active);
      }

      ${props.style}
    `}
  >
    <slot>
      {props.content}
    </slot>
  </section>
}
