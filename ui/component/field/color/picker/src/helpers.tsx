import type {ColorChannelFieldProps} from "./types.ts"
import type {ColorPickerFieldValue} from "../contract/types.ts"
import clampUnit from "@zavx0z/immersive-ui-field-color-value-clamp-unit"
import colorChannelDisplayValue from "@zavx0z/immersive-ui-field-color-value-channel-display"
import colorHsvaToValue from "@zavx0z/immersive-ui-field-color-value-from-hsva"
import rgbaCss from "@zavx0z/immersive-ui-field-color-value-rgba-css"
import wrapUnit from "@zavx0z/immersive-ui-field-color-value-wrap-unit"
import NumberField from "@zavx0z/immersive-ui-component-field-number"
import SliderField from "@zavx0z/immersive-ui-component-field-slider"

/** Частная подготовка поле интерфейса: каналы и палитра цвета. */
export const channels = ["h", "s", "v", "a"] as const

/** Частная подготовка поле интерфейса: каналы и палитра цвета. */
export const checkerCells = "10101010010101011010101001010101"

/** Частная подготовка поле интерфейса: каналы и палитра цвета. */
export function CheckerCell(props: Readonly<{dark: boolean}>) {
  return <span
    data-dark={props.dark ? "true" : undefined}
    style={css`
      display: block;
      width: 12.5%;
      height: 25%;
      background: rgb(var(--surface-550));

      &[data-dark="true"] {
        background: rgb(var(--surface-750));
      }
    `}
  >
  </span>
}

/** Частная подготовка поле интерфейса: каналы и палитра цвета. */
export function ColorSwatch(props: Readonly<{value: ColorPickerFieldValue}>) {
  return <div
    data-color-swatch=""
    style={css`
      box-sizing: border-box;
      position: relative;
      display: block;
      width: 0;
      min-width: 0;
      height: var(--field-color-picker-swatch-height);
      flex-grow: 1;
      border: var(--border-width-control) solid var(--widget-regular-outline);
      border-radius: 3px;
      overflow: clip;
    `}
  >
    <div
      style={css`
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
        height: 100%;
        overflow: clip;
      `}
    >
      {checkerCells.split("").map((dark, index) => <CheckerCell
        key={index}
        dark={dark > "0"}
      />)}
    </div>
    <span
      style={css`
        position: absolute;
        inset: 0;
        display: block;
        background: ${rgbaCss(props.value)};
      `}
    >
    </span>
  </div>
}

/** Частная подготовка поле интерфейса: каналы и палитра цвета. */
export function ColorChannelField(props: ColorChannelFieldProps) {
  const value = colorChannelDisplayValue(props.channel, props.hsva)
  const maximum = props.channel === "h" ? 360 : 1
  const step = props.channel === "h" ? 1 : 0.01
  const nextValue = (next: number): ColorPickerFieldValue => colorHsvaToValue(Object.freeze({
    ...props.hsva,
    [props.channel]: props.channel === "h" ? wrapUnit(next / 360) : clampUnit(next)
  }))
  return <div
    data-color-channel={props.channel}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      height: var(--field-color-picker-channel-height);
      gap: 3px;
    `}
  >
    <span
      style={css`
        display: inline;
        width: 14px;
        color: var(--widget-text-content-readonly);
        font-size: var(--font-size-2xs);
        text-align: center;
      `}
    >
      {props.channel.toUpperCase()}
    </span>
    <NumberField
      value={value}
      min={0}
      max={maximum}
      step={step}
      disabled={props.disabled}
      readOnly={props.readOnly}
      style={css`
        width: 56px;
        min-width: 56px;
        height: var(--field-color-picker-channel-height);
        --number-field-font-size: 10px;
        --number-field-text-align: right;
        --number-field-padding-x: 4px;
        --number-field-padding-y: 2px;
      `}
      onInput={(next, event) => props.onInput?.(nextValue(next), event)}
      onChange={(next, event) => props.onChange?.(nextValue(next), event)}
    />
    <SliderField
      value={value}
      min={0}
      max={maximum}
      step={step}
      disabled={props.disabled}
      readOnly={props.readOnly}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --slider-field-width: 100%;
        --slider-field-height: var(--field-color-picker-channel-height);
        --slider-field-padding: 2px 4px;
      `}
      onInput={(next, event) => props.onInput?.(nextValue(next), event)}
      onChange={(next, event) => props.onChange?.(nextValue(next), event)}
    />
  </div>
}
