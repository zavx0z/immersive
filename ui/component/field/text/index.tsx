/**
Поле интерфейса: текстовое значение.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {TextFieldInputEvent} from "./contract/types.ts"
import type {Zavx0zImmersiveUiComponentFieldText as Contract} from "./contract"


export type {Zavx0zImmersiveUiComponentFieldText} from "./contract"

export default function TextField(props: Contract.Input): Contract.Output {
  const hasLabel = props.label !== undefined
  const onInput = (input: HTMLInputElement, event: TextFieldInputEvent) => props.onInput?.(
    input.value,
    event
  )
  const onChange = (input: HTMLInputElement, event: Event) => props.onChange?.(
    input.value,
    event
  )
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
    <input
      data-text-field-value=""
      data-labelled={hasLabel ? "true" : undefined}
      type={props.type ?? "text"}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled === true}
      readOnly={props.readOnly === true}
      onInput={event => onInput(event.currentTarget, event)}
      onChange={event => onChange(event.currentTarget, event)}
      style={css`
        box-sizing: border-box;
        display: block;
        min-width: 0;
        width: var(--text-field-width, 160px);
        height: var(--text-field-height, var(--control-height-medium));
        padding: var(--text-field-padding, 2px 6px);
        border-width: var(--text-field-border-width, var(--border-width-control));
        border-style: solid;
        border-color: var(--text-field-outline, var(--widget-text-outline));
        border-radius: var(--text-field-radius, 3px);
        background: var(--text-field-background, var(--widget-text-background));
        box-shadow: var(--text-field-shadow, var(--shadow-2xs));
        color: var(--text-field-content, var(--widget-text-content));
        font-size: var(--text-field-font-size, var(--font-size-xs));
        line-height: var(--line-height-control);
        overflow: clip;
        text-transform: var(--text-field-transform, none);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &:hover {
          border-color: var(--text-field-hover-outline, var(--widget-text-outline-hover));
        }

        &:focus {
          border-color: var(--text-field-focus-outline, var(--widget-focus-outline));
          background: var(--text-field-focus-background, var(--text-field-background, var(--widget-text-background)));
        }

        &:disabled {
          opacity: 0.5;
          box-shadow: none;
        }

        &[readonly] {
          background: var(--widget-text-background-readonly);
          color: var(--widget-text-content-readonly);
        }
      `}
    />
  </label>
}
