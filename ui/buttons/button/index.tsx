/**
Кнопка действия с текстом, значком и состояниями взаимодействия.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ButtonProps} from "./contract/input.ts"

export type {ButtonProps} from "./contract/input"
export type {ButtonVariant, ButtonTone, ButtonSize, ButtonIconPosition} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function Button(props: ButtonProps): JSX.Element {
  const variant = props.variant ?? "contained"
  const tone = props.tone ?? "neutral"
  const size = props.size ?? "medium"
  const position = props.iconPosition ?? (
    props.endIcon !== undefined && props.startIcon === undefined ? "end" : "start"
  )
  const sharedIcon = props.iconSrc ?? ""
  const startIcon = props.startIcon ?? (position === "start" ? sharedIcon : "")
  const endIcon = props.endIcon ?? (position === "end" ? sharedIcon : "")
  const iconSize = props.iconSize ?? 14
  const showLabel = props.iconOnly !== true && props.label.length > 0

  return <button
    type="button"
    title={props.title}
    disabled={props.disabled === true}
    role={props.role}
    tabIndex={props.tabIndex ?? 0}
    aria-pressed={props.selected === undefined ? undefined : String(props.selected)}
    aria-expanded={props["aria-expanded"]}
    aria-haspopup={props["aria-haspopup"]}
    aria-label={props["aria-label"]}
    aria-selected={props["aria-selected"]}
    aria-controls={props["aria-controls"]}
    data-variant={variant}
    data-tone={tone}
    data-size={size}
    data-icon-only={String(props.iconOnly === true)}
    onClick={props.onClick}
    onKeyDown={props.onKeyDown}
    style={css`
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      min-height: var(--control-height-medium);
      gap: var(--control-content-gap);
      padding-block: 2px;
      padding-inline: 6px;
      border: var(--border-width-control) solid var(--widget-regular-outline);
      border-radius: 3px;
      background: var(--widget-regular-background);
      box-shadow: var(--shadow-2xs);
      color: var(--widget-regular-content);
      font-size: var(--font-size-xs);
      line-height: var(--line-height-control);
      overflow: clip;
      cursor: pointer;

      &:hover {
        background: var(--widget-hover-background);
      }

      &:active {
        background: var(--widget-regular-background-selected);
        color: var(--widget-regular-content-selected);
      }

      &:focus {
        border-color: var(--widget-focus-outline);
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        box-shadow: none;
      }

      &[data-variant="text"] {
        border-color: transparent;
        background: transparent;
        box-shadow: none;
      }

      &[data-variant="outlined"] {
        background: transparent;
        box-shadow: none;
      }

      &[data-variant="glass"] {
        background: var(--widget-regular-background-glass);
      }

      &[data-size="small"] {
        min-height: var(--control-height-small);
        min-width: 18px;
        padding-block: 1px;
        padding-inline: 5px;
        font-size: var(--font-size-xs);
      }

      &[data-size="large"] {
        min-height: var(--control-height-large);
        min-width: 28px;
        padding-block: 3px;
        padding-inline: 8px;
        font-size: var(--font-size-sm);
      }

      &[data-icon-only="true"] {
        height: var(--control-height-medium);
        min-height: 0;
        width: var(--control-height-medium);
        min-width: var(--control-height-medium);
        padding: 0;
        flex-shrink: 0;
      }

      &[data-icon-only="true"][data-size="small"] {
        height: var(--control-height-small);
        width: var(--control-height-small);
        min-width: var(--control-height-small);
      }

      &[data-icon-only="true"][data-size="large"] {
        height: var(--control-height-large);
        width: var(--control-height-large);
        min-width: var(--control-height-large);
      }

      &[data-variant="contained"][data-tone="primary"] {
        background: var(--widget-regular-background-selected);
      }

      &[data-variant="contained"][data-tone="success"] {
        background: var(--state-success);
      }

      &[data-variant="contained"][data-tone="warning"] {
        background: var(--state-warning);
      }

      &[data-variant="contained"][data-tone="error"] {
        background: var(--state-error);
      }

      &[aria-pressed="true"] {
        background: var(--widget-regular-background-selected);
        color: var(--widget-regular-content-selected);
      }

      &[aria-pressed="true"]:hover {
        background: var(--widget-regular-background-selected);
      }

      ${props.style}
    `}
  >
    <img
      src={startIcon}
      alt=""
      aria-hidden="true"
      width={iconSize}
      height={iconSize}
      hidden={startIcon === ""}
      style={css`
        width: var(--control-icon-size);
        height: var(--control-icon-size);
        object-fit: contain;
        flex-shrink: 0;

        &[hidden] {
          display: none;
        }
      `}
    />
    <span
      hidden={!showLabel}
      style={css`
        display: inline;
        min-width: 0;
        overflow: clip;
        white-space: nowrap;
        text-overflow: ellipsis;

        &[hidden] {
          display: none;
        }
      `}
    >
      {props.label}
    </span>
    <img
      src={endIcon}
      alt=""
      aria-hidden="true"
      width={iconSize}
      height={iconSize}
      hidden={endIcon === ""}
      style={css`
        width: var(--control-icon-size);
        height: var(--control-icon-size);
        object-fit: contain;
        flex-shrink: 0;

        &[hidden] {
          display: none;
        }
      `}
    />
  </button>
}

export type {ButtonPointerEvent, ButtonKeyboardEvent} from "./contract/types"
