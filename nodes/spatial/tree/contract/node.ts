/** Данные сущности; геометрия, проекция и навигация принадлежат пространственному представлению. */
export interface SpatialTreeNode {
  readonly id: string
  readonly parentId?: string
  readonly label: string
  /** Размер логического Display в CSS px; без значения используется viewport представления. */
  readonly viewport?: Readonly<{width: number; height: number}>
  /** CSS-цвет или RGB; по умолчанию наследуется устойчивый цвет корневой ветви. */
  readonly color?: string | number
}
