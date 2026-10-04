import type {Zavx0zImmersiveUiComponentWidgetHeader} from "@zavx0z/immersive-ui-component-widget-header"
type WidgetAction = NonNullable<Zavx0zImmersiveUiComponentWidgetHeader.Input["actions"]>[number]
import type {Zavx0zImmersiveUiComponentBadge} from "@zavx0z/immersive-ui-component-badge"

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
  tone?: Zavx0zImmersiveUiComponentBadge.Input["tone"] | undefined
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
