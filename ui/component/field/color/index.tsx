/**
Поле интерфейса: цвет.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiFieldsColorField as Contract} from "./contract"
import {useCallback} from "@zavx0z/component"
import {useState} from "@zavx0z/component"
import Button from "@ui-buttons/button"
import formatColorValue from "@ui-fields-color-value/format-color-value"
import normalizeColorValue from "@ui-fields-color-value/normalize-color-value"
import ColorPickerField from "@ui-fields/color-picker-field"


export type {UiFieldsColorField} from "./contract"

export default function ColorField(props: Contract.Input): Contract.Output {
  if (!props.value || typeof props.value !== "object") throw new TypeError("ColorField value must be an object")
  const value = normalizeColorValue(props.value)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = props.open ?? internalOpen
  const hasLabel = props.label !== undefined
  const setOpen = (next: boolean, event: Event) => {
    if (props.open === undefined) setInternalOpen(next)
    props.onOpenChange?.(next, event)
  }
  const bindPicker = useCallback((element: HTMLDivElement | null) => {
    if (!element?.isConnected) return
    const trigger = element.parentElement?.querySelector("button")
    if (!trigger?.isConnected) return
    if (open) element.showPopover({source: trigger})
    else if (element.popover !== null) element.hidePopover()
  }, [open])
  const onToggle = (event: PointerEvent) => {
    if (props.disabled !== true) setOpen(!open, event)
  }
  const onPickerToggle = (event: ToggleEvent) => {
    const showing = event.newState === "open"
    if (showing !== open) setOpen(showing, event)
  }
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
      data-readonly={props.readOnly === true ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: block;
        width: 280px;
        min-width: 0;

        &[data-labelled="true"] {
          width: 0;
          flex-grow: 1;
        }

        &[data-readonly="true"] {
          color: var(--widget-text-content-readonly);
        }
      `}
    >
      <Button
        label={formatColorValue(value)}
        title={props.title}
        disabled={props.disabled === true}
        selected={open}
        aria-expanded={String(open)}
        style={css`
          width: 100%;
          height: var(--field-height-regular);
          justify-content: flex-start;
          padding: 3px 7px;

          ${open && css`
            background: var(--widget-active-background);
          `}
        `}
        onClick={onToggle}
      />
      <div
        ref={bindPicker}
        popover="auto"
        onToggle={onPickerToggle}
        style={css`
          box-sizing: border-box;
          display: block;
          width: 280px;
        `}
      >
        <ColorPickerField
          value={value}
          disabled={props.disabled}
          readOnly={props.readOnly}
          style={css`
            width: 280px;
          `}
          onInput={props.onInput}
          onChange={props.onChange}
        />
      </div>
    </div>
  </div>
}
