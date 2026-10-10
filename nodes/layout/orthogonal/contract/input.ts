import type {LayoutNodeGeometry, LayoutPoint} from "../../protocol/types/src/protocol.ts"

/** Уже размещённые карточки и точные окончания связей в общей числовой плоскости. */
export interface OrthogonalRoutingInput {
  readonly nodes: readonly LayoutNodeGeometry[]
  readonly edges: readonly Readonly<{
    id: string
    source: Readonly<{nodeId: string; point: LayoutPoint; side: "WEST" | "EAST" | "NORTH" | "SOUTH"}>
    target: Readonly<{nodeId: string; point: LayoutPoint; side: "WEST" | "EAST" | "NORTH" | "SOUTH"}>
  }>[]
  readonly options?: Readonly<{
    /** Зазор от карточек, положительное число; по умолчанию 12. */
    clearance?: number
    /** Максимум карточек полного набора для прежнего solver, 2..64; по умолчанию 32. */
    maxObstacles?: number
    /** Число обращений к прежнему solver на весь batch, 0..64; по умолчанию 8. */
    maxFallbacks?: number
    /** Число обрабатываемых связей, от 1 до 10000; по умолчанию 4000. */
    maxEdges?: number
    /** Предел общей сетки коридоров, 0..1000000; по умолчанию 100000. */
    maxGridPoints?: number
    /** Общий предел раскрытий поиска в batch, 0..8000000; по умолчанию 1000000. */
    maxSearchSteps?: number
  }>
}
