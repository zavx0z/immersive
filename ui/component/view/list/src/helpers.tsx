import type {UiViewsList} from "../contract/index"
type ListProps = UiViewsList.Input
import type {ListRowProps} from "./types"

/** Частная подготовка список элементов с выбором и доступным пустым состоянием. */
export function ListRow(props: ListRowProps) {
  const onClick = (event: PointerEvent) => {
    if (!props.disabled) props.onSelect?.(props.item.key, event)
  }
  return <li
    role="option"
    data-item-key={props.item.key}
    aria-selected={String(props.selected)}
    aria-disabled={String(props.disabled)}
    data-dense={props.dense ? "true" : undefined}
    data-embedded={props.embedded ? "true" : undefined}
    onClick={onClick}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      min-height: 28px;
      padding: 3px 7px;
      border-radius: 3px;
      color: var(--widget-list-content);
      font-size: var(--font-size-xs);

      &:hover {
        background: var(--widget-regular-background);
      }

      &[data-embedded="true"] {
        min-height: 26px;
      }

      &[data-dense="true"] {
        min-height: 24px;
        padding: 2px 6px;
      }

      &[aria-selected="true"] {
        background: var(--widget-list-background-selected);
        color: var(--widget-list-content-selected);
      }

      &[aria-disabled="true"] {
        opacity: 0.5;
      }
    `}
  >
    <img
      src={props.item.iconSrc ?? ""}
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      hidden={props.item.iconSrc === undefined}
      style={css`
        display: block;
        width: 16px;
        min-width: 16px;
        height: 16px;
        margin-right: 6px;
        object-fit: contain;

        &[hidden] {
          display: none;
        }
      `}
    />
    <span
      style={css`
        display: inline;
        min-width: 0;
        flex-grow: 1;
      `}
    >
      {props.item.label}
    </span>
    <span
      style={css`
        display: inline;
        color: var(--widget-text-content-readonly);
        font-size: var(--font-size-2xs);
      `}
    >
      {props.item.detail ?? ""}
    </span>
  </li>
}

/** Частная подготовка список элементов с выбором и доступным пустым состоянием. */
export function EmptyListRow(props: Readonly<{label: string}>) {
  return <li
    aria-disabled="true"
    style={css`
      display: block;
      min-height: 24px;
      padding: 4px 8px;
      color: var(--widget-text-content-readonly);
      font-size: var(--font-size-xs);
    `}
  >
    {props.label}
  </li>
}

/** Частная подготовка список элементов с выбором и доступным пустым состоянием. */
export function assertListProps(props: ListProps): string | null {
  if (!Array.isArray(props.items)) throw new TypeError("List items must be an array")
  const keys = new Set<string>()
  for (const item of props.items) {
    if (typeof item.key !== "string" || item.key.length === 0) throw new TypeError("List item key must not be empty")
    if (keys.has(item.key)) throw new Error(`List item key must be unique: ${item.key}`)
    keys.add(item.key)
    if (typeof item.label !== "string") throw new TypeError("List item label must be a string")
  }
  const selectedKey = props.selectedKey ?? null
  if (selectedKey !== null && !keys.has(selectedKey)) throw new Error(`List selected key does not exist: ${selectedKey}`)
  return selectedKey
}
