/**
Поле интерфейса: группа полей.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentFieldGroup as Contract} from "./contract"
import {hasSlot} from "@immersive/component/slot-presence"
import resolveFieldDensity from "@immersive-ui-field-metric/resolve-density"


export type {ImmersiveUiComponentFieldGroup} from "./contract"

export default function FieldGroup(props: Contract.Input): Contract.Output {
  if (!hasSlot()) {
    throw new TypeError("FieldGroup requires non-empty slot content")
  }
  const density = resolveFieldDensity(props.density, "regular", "FieldGroup")
  const hasLabel = props.label !== undefined
  return <div
    data-has-label={hasLabel ? "true" : undefined}
    title={props.title}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      width: auto;
      min-width: 0;
      padding: 0;
      color: var(--widget-list-content);

      &[data-has-label="true"] {
        width: 100%;
        min-height: var(--field-label-height);
        gap: var(--field-label-gap);
      }

      ${props.style}
    `}
  >
    <span
      hidden={!hasLabel}
      style={css`
        box-sizing: border-box;
        display: block;
        width: 40%;
        min-width: 0;
        height: var(--field-label-height);
        line-height: var(--field-label-height);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        color: var(--widget-list-content);
        font-size: var(--font-size-sm);

        &[hidden] {
          display: none;
        }
      `}
    >
      {props.label ?? ""}
    </span>
    <div
      data-field-group=""
      data-labelled={hasLabel ? "true" : undefined}
      data-density={density}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        width: 100%;
        min-width: 0;
        height: var(--control-height-large);
        --field-group-content-height: var(--field-group-content-height-regular);
        gap: 0;
        padding: 0;
        border: var(--border-width-control) solid var(--widget-regular-outline);
        border-radius: 4px;
        overflow: clip;
        background: var(--widget-regular-background);
        box-shadow: var(--shadow-2xs);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &[data-density="compact"] {
          height: var(--field-height-compact);
          --field-group-content-height: var(--field-group-content-height-compact);
        }

        &:focus-within {
          border-color: var(--widget-focus-outline);
        }
      `}
    >
      <slot />
    </div>
  </div>
}
