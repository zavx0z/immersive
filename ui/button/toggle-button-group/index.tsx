/**
Группа кнопок выбора одного строкового значения из набора.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiButtonsToggleButtonGroup} from "./contract"
import Button from "@ui-buttons/button"
import validateSelectionOptions from "@ui-selection/validate-selection-options"


export type {UiButtonsToggleButtonGroup} from "./contract"

export default function ToggleButtonGroup(props: UiButtonsToggleButtonGroup.Input): UiButtonsToggleButtonGroup.Output {
  if (typeof props.value !== "string") throw new TypeError("ToggleButtonGroup value must be a string")
  const options = validateSelectionOptions(props.options)
  const density = props.density ?? "regular"
  if (density !== "regular" && density !== "compact") throw new Error(`Unknown ToggleButtonGroup density: ${density}`)
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
        display: flex;
        align-items: center;
        width: 40%;
        min-width: 0;
        height: var(--field-label-height);
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
      data-labelled={hasLabel ? "true" : undefined}
      data-density={density}
      data-readonly={props.readOnly === true ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        width: 180px;
        min-width: 0;
        gap: var(--space-1);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &[data-density="compact"] {
          gap: 2px;
        }

        &[data-readonly="true"] {
          color: var(--widget-text-content-readonly);
        }
      `}
    >
      {options.map(option => <Button
        key={option.key}
        label={option.label}
        startIcon={option.iconSrc}
        title={option.title ?? option.description}
        selected={option.value === props.value}
        disabled={props.disabled === true || option.disabled === true}
        style={css`
          width: 0;
          min-width: 44px;
          flex-grow: 1;
          border-radius: 3px;

          ${density === "compact" && css`
            height: var(--control-height-medium);
            padding: 2px 6px;
          `}
        `}
        onClick={event => {
          if (props.readOnly !== true) props.onChange?.(option.value, event)
        }}
      />)}
    </div>
  </div>
}
