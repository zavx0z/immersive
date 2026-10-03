/**
Строка действия контекстного меню.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {UiMenusMenuItem} from "./contract"


export type {UiMenusMenuItem} from "./contract"

export default function MenuItem(props: UiMenusMenuItem.Input): UiMenusMenuItem.Output {
  return <button
    type="button"
    role="menuitem"
    disabled={props.disabled === true}
    tabIndex={-1}
    onClick={() => props.onSelect()}
    style={css`
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      width: 100%;
      height: 26px;
      padding: 3px 8px;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: var(--widget-regular-content);
      font-size: var(--font-size-sm);
      user-select: none;

      &:hover {
        background: var(--widget-regular-background-selected);
        color: var(--widget-regular-content-selected);
      }

      &:focus {
        background: var(--widget-regular-background-selected);
        color: var(--widget-regular-content-selected);
      }

      &:disabled {
        opacity: 0.45;
      }
    `}
  >
    <span>{props.label}</span>
    <span
      aria-hidden="true"
      style={css`
        color: var(--widget-regular-content);
        font-size: var(--font-size-xs);
      `}
    >
      {props.shortcut ?? ""}
    </span>
  </button>
}
