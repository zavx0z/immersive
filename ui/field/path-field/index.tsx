/**
Поле интерфейса: путь.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsPathField as Contract} from "./contract"
import IconButton from "@ui-buttons/icon-button"
import folderIcon from "@ui-themes-icons/folder"
import TextField from "@ui-fields/text-field"


export type {UiFieldsPathField} from "./contract"

export default function PathField(props: Contract.Input): Contract.Output {
  if (typeof props.value !== "string") throw new TypeError("PathField value must be a string")
  const density = props.density ?? "regular"
  if (density !== "regular" && density !== "compact") throw new Error(`Unknown PathField density: ${density}`)
  const hasLabel = props.label !== undefined
  const browseUnavailable = props.onBrowse === undefined
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
        min-width: 0;
        width: 320px;
        height: var(--control-height-large);
        gap: 0;
        padding: 0;
        overflow: clip;
        border: var(--border-width-control) solid var(--widget-regular-outline);
        border-radius: 4px;
        background: var(--widget-text-background);
        box-shadow: var(--shadow-2xs);

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &[data-density="compact"] {
          width: 220px;
          height: var(--field-path-height-compact);
        }

        &[data-labelled="true"][data-density="compact"] {
          width: 0;
        }
      `}
    >
      <TextField
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        readOnly={props.readOnly}
        title={props.title}
        style={css`
          width: 0;
          min-width: 0;
          flex-grow: 1;
          border-right: 1px solid var(--widget-regular-outline);
          --text-field-width: 100%;
          --text-field-height: var(--field-frame-content-height-regular);
          --text-field-padding: 3px 7px;
          --text-field-border-width: 0px;
          --text-field-radius: 0px;
          --text-field-shadow: none;
          --text-field-font-size: 11px;
          --text-field-background: transparent;
          --text-field-hover-outline: transparent;
          --text-field-focus-outline: transparent;
          --text-field-focus-background: var(--widget-text-background-focus);

          ${density === "compact" && css`
            --text-field-height: var(--field-frame-content-height-compact);
          `}

          ${props.readOnly === true && css`
            opacity: 0.5;
          `}
        `}
        onInput={props.onInput}
        onChange={props.onChange}
      />
      <IconButton
        label="Browse"
        iconSrc={folderIcon}
        variant="contained"
        title={props.browseTitle}
        disabled={props.disabled === true || props.readOnly === true || browseUnavailable}
        style={css`
          width: 30px;
          min-width: 30px;
          height: var(--field-frame-content-height-regular);
          padding: 0;
          border: none;
          border-radius: 0;
          box-shadow: none;
          color: var(--widget-regular-content);
          font-size: 12px;

          ${density === "compact" && css`
            height: var(--field-frame-content-height-compact);
          `}

          ${browseUnavailable && css`
            display: none;
          `}
        `}
        onClick={props.onBrowse}
      />
    </div>
  </div>
}
