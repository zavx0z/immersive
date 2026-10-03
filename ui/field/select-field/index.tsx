/**
Поле интерфейса: выбор значения.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SelectFieldOption} from "./contract/types.ts"
import type {UiFieldsSelectField as Contract} from "./contract"
import {SelectOption} from "./src/helpers.tsx"
import findSelectionOption from "@ui-selection/find-selection-option"
import selectionExceptionalLabel from "@ui-selection/selection-exceptional-label"
import validateSelectionOptions from "@ui-selection/validate-selection-options"
import validateSelectionState from "@ui-selection/validate-selection-state"


export type {UiFieldsSelectField} from "./contract"

export default function SelectField(props: Contract.Input): Contract.Output {
  if (typeof props.value !== "string") throw new TypeError("SelectField value must be a string")
  validateSelectionState(props.state)
  const options = props.options === undefined ? undefined : validateSelectionOptions(props.options)
  const density = props.density ?? "compact"
  if (density !== "regular" && density !== "compact") throw new Error(`Unknown SelectField density: ${density}`)
  const exceptionalLabel = selectionExceptionalLabel(props.state, options)
  const selected = options === undefined ? undefined : findSelectionOption(props.value, options)
  const displayedOptions: readonly SelectFieldOption[] = selected === undefined && exceptionalLabel === undefined
    ? [Object.freeze({key: "__invalid__", value: props.value, label: props.value, disabled: true}), ...(options ?? [])]
    : options ?? []
  const hasLabel = props.label !== undefined
  const onChange = (select: HTMLSelectElement, event: Event) => {
    if (props.readOnly === true) {
      select.value = props.value
      return
    }
    props.onChange?.(select.value, event)
  }
  return <label
    data-has-label={hasLabel ? "true" : undefined}
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
    <span
      data-density={density}
      data-labelled={hasLabel ? "true" : undefined}
      data-readonly={props.readOnly === true ? "true" : undefined}
      data-disabled={props.disabled === true || exceptionalLabel !== undefined ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        position: relative;
        display: block;
        min-width: 0;
        width: 180px;
        height: var(--control-height-large);
        --select-field-surface: var(--widget-text-background);
        --select-field-content: var(--widget-regular-content);
        border: var(--border-width-control) solid var(--widget-regular-outline);
        border-radius: var(--radius-medium);
        background: var(--select-field-surface);
        box-shadow: var(--shadow-2xs);
        color: var(--widget-regular-content);
        font-size: var(--font-size-sm);
        overflow: clip;

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &:hover {
          --select-field-surface: var(--widget-hover-background);
        }

        &:focus-within {
          border-color: var(--widget-focus-outline);
          --select-field-surface: var(--widget-text-background-focus);
        }

        &[data-disabled="true"] {
          opacity: 0.5;
          box-shadow: none;
        }

        &[data-density="compact"] {
          height: var(--control-height-medium);
          font-size: var(--font-size-xs);
          --select-field-padding: 2px 6px;
        }

        &[data-readonly="true"] {
          --select-field-content: var(--widget-text-content-readonly);
        }
      `}
    >
      <select
        disabled={props.disabled === true || exceptionalLabel !== undefined}
        title={selected?.description ?? props.title}
        onChange={event => onChange(event.currentTarget, event)}
        style={css`
          box-sizing: border-box;
          display: block;
          width: 100%;
          height: 100%;
          padding: var(--select-field-padding, 3px 8px);
          border: 0;
          background: transparent;
          color: var(--select-field-content);
        `}
      >
        <optgroup label="">
          <option
            value=""
            selected={exceptionalLabel !== undefined}
            disabled={true}
            hidden={exceptionalLabel === undefined}
          >
            {exceptionalLabel ?? ""}
          </option>
          {displayedOptions.map(option => <SelectOption
            key={option.key}
            option={option}
            selected={exceptionalLabel === undefined && option.value === props.value}
            hidden={exceptionalLabel !== undefined}
          />)}
        </optgroup>
      </select>
    </span>
  </label>
}
