/** Измеренная карточка дерева. Отсутствие parentId обозначает корень леса. */
export interface HierarchyLayoutNode {
  readonly id: string
  readonly parentId?: string
  readonly width: number
  readonly height: number
}

