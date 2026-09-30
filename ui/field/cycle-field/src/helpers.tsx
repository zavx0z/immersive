import type {CycleOptionProps} from "../contract/types.ts"
import Button from "@ui-buttons/button"

/** Частная подготовка поле интерфейса: циклический выбор. */
export function CycleOption(props: CycleOptionProps) {
  return <Button
    role="option"
    tabIndex={props.focusable ? 0 : -1}
    aria-selected={String(props.selected)}
    label={props.option.label}
    startIcon={props.option.iconSrc}
    title={props.option.title ?? props.option.description}
    variant={props.selected ? "contained" : "text"}
    tone={props.selected ? "primary" : "neutral"}
    disabled={props.disabled || props.option.disabled === true}
    style={css`
      width: 100%;
      height: 26px;
      justify-content: flex-start;
      border: 0;
      background: transparent;
      box-shadow: none;
    `}
    onClick={event => props.onSelect(props.option.key, event)}
    onKeyDown={event => props.onKeyDown(props.option.key, event, event.currentTarget)}
  />
}
