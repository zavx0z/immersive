/**
Текст интерфейса с выбранным типографическим вариантом.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {TypographyProps} from "./contract/input.ts"

export type {TypographyProps} from "./contract/input"
export type {TypographyVariant} from "./contract/types"

import type {JSX} from "@jsx-compiler/session"

export default function Typography(props: TypographyProps): JSX.Element {
  const variant = props.variant ?? "body"
  return <span
    title={props.title}
    data-variant={variant}
    style={css`
      display: inline;
      color: var(--widget-regular-content);
      font-size: var(--font-size-sm);
      line-height: 16px;

      &[data-variant="title"] {
        font-size: var(--font-size-lg);
        line-height: 20px;
      }

      &[data-variant="subtitle"] {
        color: var(--widget-list-content);
        font-size: var(--font-size-md);
        line-height: 18px;
      }

      &[data-variant="caption"] {
        color: var(--widget-text-content-readonly);
        font-size: var(--font-size-xs);
        line-height: 14px;
      }

      ${props.style}
    `}
  >
    {props.text}
  </span>
}
