/**
Компактная подпись состояния с цветовым тоном.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {BadgeProps} from "./contract/input.ts"

export type {BadgeProps} from "./contract/input"
export type {BadgeTone} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function Badge(props: BadgeProps): JSX.Element {
  const tone = props.tone ?? "neutral"
  return <span
    title={props.title}
    data-tone={tone}
    style={css`
      box-sizing: border-box;
      display: inline;
      min-height: 20px;
      padding: 2px 6px;
      border: 1px solid var(--widget-regular-outline);
      border-radius: 3px;
      background: var(--widget-number-background-readonly);
      color: var(--widget-regular-content);
      font-size: var(--font-size-xs);

      &[data-tone="info"] {
        background: var(--state-info);
      }

      &[data-tone="success"] {
        background: var(--state-success);
      }

      &[data-tone="warning"] {
        background: var(--state-warning);
      }

      &[data-tone="error"] {
        background: var(--state-error);
      }

      ${props.style}
    `}
  >
    {props.label}
  </span>
}
