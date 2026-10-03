import type {WidgetAction} from "@ui-widgets/header"
import type {UiBadge} from "@ui/badge"
import type {WindowedTreeBlock} from "../src/windowing.ts"

/**
Тип TreeItem принадлежит контракту своего владельца.
*/
export type TreeItem = Readonly<{
  id: string
  label: string
  iconSrc?: string | undefined
  detail?: string | undefined
  title?: string | undefined
  disabled?: boolean | undefined
  muted?: boolean | undefined
  expandable?: boolean | undefined
  /** Ветвь для раскрытия сохраняет фокус, но не входит в выбор. */
  selectable?: boolean | undefined
  /** Помечает текущую страницу независимо от выбранных ключей. */
  current?: boolean | undefined
  tone?: UiBadge.Input["tone"] | undefined
  children?: readonly TreeItem[] | undefined
  actions?: readonly WidgetAction[] | undefined
}>

/**
Тип TreeHandle принадлежит контракту своего владельца.
*/
export type TreeHandle = Readonly<{
  focus(id?: string): void
  /**
  Показывает только собственную строку раскрытой ветви, сохраняя текущий фокус.
  Высота вложенных строк не участвует в выравнивании прокрутки.

  @param id - Точный ключ видимой строки; родителей раскрывает владелец expandedKeys.
  @returns false, если строка отсутствует или находится в свёрнутой ветви.
  */
  reveal(id: string): boolean
}>

/**
Тип TreeRow принадлежит контракту своего владельца.
*/
export type TreeRow = Readonly<{item: TreeItem; parent: string | null}>

/**
Тип TreeItemBlock принадлежит контракту своего владельца.
*/
export type TreeItemBlock = Extract<WindowedTreeBlock<TreeItem>, {kind: "item"}>

/**
Тип TreeContext принадлежит контракту своего владельца.
*/
export type TreeContext = Readonly<{
  expanded: ReadonlySet<string>
  selected: ReadonlySet<string>
  focusKey: string | null
  refs: Map<string, HTMLLIElement>
  select(id: string, event: MouseEvent): void
  toggle(id: string, event: Event): void
  activate(id: string, event: Event): void
  key(id: string, event: KeyboardEvent): void
  focusIn(id: string): void
  rowHeight: number
}>
