import type {StatusBarItem} from "../contract/types.ts"
import type {StatusBarItemViewProps} from "./types"

/** Частная подготовка строка состояния с областями текста и действий. */
export function StatusBarItemView(props: StatusBarItemViewProps) {
  return <span
    data-status-item={props.item.id}
    data-highlighted={props.item.highlighted === true ? "true" : undefined}
    style={css`
      display: flex;
      flex-direction: row;
      min-width: 0;
      flex-shrink: 0;
      color: var(--status-bar-content);
      white-space: nowrap;
      text-shadow: 0 1px 0 var(--status-bar-content-shadow);

      &[data-highlighted="true"] {
        color: var(--status-bar-content-highlight);
      }
    `}
  >
    <span
      aria-hidden="true"
      hidden={props.first}
      style={css`
        display: inline;

        &[hidden] {
          display: none;
        }
      `}
    >
      {props.separator}
    </span>
    <span>{props.item.text}</span>
  </span>
}

/** Частная подготовка строка состояния с областями текста и действий. */
export function StatusBarItems(props: Readonly<{
  items: readonly StatusBarItem[]
  separator: string
  alignment: "start" | "end"
  hidden?: boolean | undefined
}>) {
  return <span
    data-alignment={props.alignment}
    hidden={props.hidden === true}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      min-width: 0;
      overflow: clip;

      &[data-alignment="start"] {
        flex-grow: 1;
        justify-content: flex-start;
      }

      &[data-alignment="end"] {
        justify-content: flex-end;
      }

      &[hidden] {
        display: none;
      }
    `}
  >
    {props.items.map(item => <StatusBarItemView
      key={item.id}
      item={item}
      first={item.id === props.items[0]?.id}
      separator={props.separator}
    />)}
  </span>
}

/** Частная подготовка строка состояния с областями текста и действий. */
export function normalizeStatusBarItems(
  items: readonly StatusBarItem[]
): readonly StatusBarItem[] {
  if (!Array.isArray(items)) invalidStatusBarItems()
  const ids = new Set<string>()
  for (const item of items) {
    if (!item || typeof item !== "object") invalidStatusBarItems()
    if (typeof item.id !== "string" || item.id.length === 0) invalidStatusBarItems()
    if (ids.has(item.id)) invalidStatusBarItems()
    ids.add(item.id)
    if (typeof item.text !== "string") invalidStatusBarItems()
    if (item.highlighted !== undefined && typeof item.highlighted !== "boolean") invalidStatusBarItems()
  }
  return items
}

/** Частная подготовка строка состояния с областями текста и действий. */
export function invalidStatusBarItems(): never {
  throw new TypeError("Invalid StatusBar items")
}
