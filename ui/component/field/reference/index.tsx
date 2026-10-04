/**
Поле интерфейса: ссылка на ресурс.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentFieldReference as Contract} from "./contract"
import {validateReferenceField} from "./src/helpers.tsx"
import Button from "@immersive-ui-component-button/basic"
import IconButton from "@immersive-ui-component-button/icon"
import closeIcon from "@immersive-ui-theme-icon/close"
import pickerIcon from "@immersive-ui-theme-icon/picker"
import resourceIcon from "@immersive-ui-theme-icon/resource"


export type {ImmersiveUiComponentFieldReference} from "./contract"

export default function ReferenceField(props: Contract.Input): Contract.Output {
  validateReferenceField(props)
  const density = props.density ?? "regular"
  const hasLabel = props.label !== undefined
  const pickUnavailable = props.onPick === undefined
  const clearUnavailable = props.value === null || props.onClear === undefined
  const valueLabel = props.value?.label ?? props.placeholder ?? "Not selected"
  return <div
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
      data-labelled={hasLabel ? "true" : undefined}
      data-density={density}
      data-readonly={props.readOnly === true ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        min-width: 0;
        width: 260px;
        height: var(--control-height-large);
        gap: 0;
        padding: 0;
        overflow: clip;
        border: var(--border-width-control) solid var(--widget-regular-outline);
        border-radius: 4px;
        background: var(--widget-regular-background);
        box-shadow: var(--shadow-2xs);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &[data-density="compact"] {
          width: 190px;
          height: var(--field-reference-height-compact);
        }

        &[data-labelled="true"][data-density="compact"] {
          width: 0;
        }

        &[data-readonly="true"] {
          color: var(--widget-text-content-readonly);
        }
      `}
    >
      <Button
        label={valueLabel}
        startIcon={resourceIcon}
        variant="text"
        title={props.title ?? props.value?.kind}
        disabled={props.disabled === true || props.onActivate === undefined}
        style={css`

  height: var(--field-frame-content-height-regular);
  padding: 3px 7px;
  border: none;
  border-right: 1px solid var(--widget-regular-outline);
  border-radius: 0;
  box-shadow: none;
  color: var(--widget-regular-content);
  font-size: 11px;


          width: 0;
          min-width: 0;
          flex-grow: 1;
          justify-content: flex-start;

          ${density === "compact" && css`
  height: var(--field-frame-content-height-compact);
`}
        `}
        onClick={props.onActivate}
      />
      <IconButton
        label="Choose reference"
        iconSrc={pickerIcon}
        disabled={props.disabled === true || props.readOnly === true || pickUnavailable}
        style={css`

  height: var(--field-frame-content-height-regular);
  padding: 3px 7px;
  border: none;
  border-right: 1px solid var(--widget-regular-outline);
  border-radius: 0;
  box-shadow: none;
  color: var(--widget-regular-content);
  font-size: 11px;



  width: 28px;
  min-width: 28px;
  justify-content: center;


          ${density === "compact" && css`
  height: var(--field-frame-content-height-compact);
`}

          ${pickUnavailable && css`
  display: none;
`}
        `}
        onClick={props.onPick}
      />
      <IconButton
        label="Clear reference"
        iconSrc={closeIcon}
        disabled={props.disabled === true || props.readOnly === true || clearUnavailable}
        style={css`

  height: var(--field-frame-content-height-regular);
  padding: 3px 7px;
  border: none;
  border-right: 1px solid var(--widget-regular-outline);
  border-radius: 0;
  box-shadow: none;
  color: var(--widget-regular-content);
  font-size: 11px;



  width: 28px;
  min-width: 28px;
  justify-content: center;


          border-right: 0;

          ${density === "compact" && css`
  height: var(--field-frame-content-height-compact);
`}

          ${clearUnavailable && css`
  display: none;
`}
        `}
        onClick={props.onClear}
      />
    </div>
  </div>
}
