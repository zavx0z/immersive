/**
Поле интерфейса: каналы и палитра цвета.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {ColorChannelField} from "./src/helpers.tsx"
import type {ImmersiveUiComponentFieldColorPicker as Contract} from "./contract"
import {ColorSwatch} from "./src/helpers.tsx"
import {channels} from "./src/helpers.tsx"
import colorValueToHsva from "@immersive-ui-field-color-value/to-hsva"
import formatColorValue from "@immersive-ui-field-color-value/format"
import normalizeColorValue from "@immersive-ui-field-color-value/normalize"
import parseColorValue from "@immersive-ui-field-color-value/parse"
import TextField from "@immersive-ui-component-field/text"


export type {ImmersiveUiComponentFieldColorPicker} from "./contract"

export default function ColorPickerField(props: Contract.Input): Contract.Output {
  if (!props.value || typeof props.value !== "object") throw new TypeError("ColorPickerField value must be an object")
  const value = normalizeColorValue(props.value)
  const hsva = colorValueToHsva(value)
  const hasLabel = props.label !== undefined
  const emitHex = (kind: "input" | "change", text: string, event: Event) => {
    const next = parseColorValue(text)
    if (next === null || props.disabled === true || props.readOnly === true) return
    if (kind === "input") props.onInput?.(next, event)
    else props.onChange?.(next, event)
  }
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
      data-color-picker-field=""
      data-labelled={hasLabel ? "true" : undefined}
      data-readonly={props.readOnly === true ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 280px;
        min-width: 0;
        height: var(--field-color-picker-height);
        gap: var(--field-color-picker-gap);
        padding: var(--field-color-picker-padding);
        border: var(--field-color-picker-border-width) solid var(--widget-focus-outline);
        border-radius: 4px;
        background: var(--widget-popup-background);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &[data-readonly="true"] {
          color: var(--widget-text-content-readonly);
        }
      `}
    >
      <div
        style={css`
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: center;
          width: 100%;
          gap: 4px;
        `}
      >
        <ColorSwatch value={value} />
        <TextField
          value={formatColorValue(value)}
          disabled={props.disabled}
          readOnly={props.readOnly}
          style={css`
            width: 92px;
            min-width: 92px;
            --text-field-width: 92px;
            --text-field-height: var(--field-color-picker-channel-height);
            --text-field-transform: uppercase;
          `}
          onInput={(text, event) => emitHex("input", text, event)}
          onChange={(text, event) => emitHex("change", text, event)}
        />
      </div>
      {channels.map(channel => <ColorChannelField
        key={channel}
        channel={channel}
        hsva={hsva}
        disabled={props.disabled === true}
        readOnly={props.readOnly === true}
        onInput={props.onInput}
        onChange={props.onChange}
      />)}
    </div>
  </div>
}
