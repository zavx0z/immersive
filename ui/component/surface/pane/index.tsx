/**
Поверхность содержимого с вариантом оформления и безымянным слотом.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentSurfacePane as Contract} from "./contract"
import {hasSlot} from "@immersive/component/slot-presence"


export type {ImmersiveUiComponentSurfacePane} from "./contract"

export default function Pane(props: Contract.Input): Contract.Output {
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
