import type {LayoutEdgeSection} from "../../../protocol/types/src/protocol.ts"

/** Связь parentId → id с маршрутом между нижним и верхним центрами карточек. */
export interface HierarchyLayoutEdge {
  /** Уникальный идентификатор hierarchy:<индекс ребёнка во входном массиве>. */
  readonly id: string
  readonly sourceNodeId: string
  readonly targetNodeId: string
  readonly sections: readonly [LayoutEdgeSection]
}

