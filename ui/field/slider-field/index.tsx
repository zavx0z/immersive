/**
Поле интерфейса: числовой диапазон.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SliderFieldProps} from "./contract/input.ts"
import {validateSliderField} from "./src/helpers.tsx"
import resolveFieldDensity from "@ui-fields-metrics/resolve-field-density"

export type {SliderFieldProps} from "./contract/input"
export type {SliderFieldDensity} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function SliderField(props: SliderFieldProps): JSX.Element {
  const step = validateSliderField(props)
  const density = resolveFieldDensity(props.density, "regular", "SliderField")
  const hasLabel = props.label !== undefined
  const readValue = (input: HTMLInputElement): number => input.valueAsNumber
  const restore = (input: HTMLInputElement): void => {
    input.valueAsNumber = props.value
  }
  const onInput = (input: HTMLInputElement, event: InputEvent) => {
    if (props.readOnly === true) return restore(input)
    props.onInput?.(readValue(input), event)
  }
  const onChange = (input: HTMLInputElement, event: Event) => {
    if (props.readOnly === true) return restore(input)
    props.onChange?.(readValue(input), event)
  }
  return <label
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
    <input
      data-slider-field-value=""
      data-labelled={hasLabel ? "true" : undefined}
      data-density={density}
      data-readonly={props.readOnly === true ? "true" : undefined}
      type="range"
      min={props.min}
      max={props.max}
      step={step}
      value={props.value}
      disabled={props.disabled === true}
      onInput={event => onInput(event.currentTarget, event)}
      onChange={event => onChange(event.currentTarget, event)}
      style={css`
        box-sizing: border-box;
        display: block;
        width: var(--slider-field-width, 180px);
        height: var(--slider-field-height, var(--control-height-large));
        padding: var(--slider-field-padding, 3px 6px);
        border: var(--border-width-control) solid var(--widget-regular-outline);
        border-radius: 4px;
        background: var(--widget-regular-background);
        box-shadow: var(--shadow-2xs);
        color: var(--widget-regular-background-selected);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &[data-density="compact"] {
          height: var(--slider-field-height, var(--field-height-compact));
        }

        &:hover {
          background: var(--widget-hover-background);
        }

        &:active {
          background: var(--widget-active-background);
        }

        &:focus {
          border-color: var(--widget-focus-outline);
        }

        &:disabled {
          opacity: 0.5;
          box-shadow: none;
        }

        &[data-readonly="true"] {
          color: var(--widget-text-content-readonly);
        }
      `}
    />
  </label>
}
