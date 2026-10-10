import type {LayoutPoint, LayoutRectangle} from "../../protocol/types/src/protocol.ts"

/** Безопасные маршруты и явные отказы ограниченного поиска, без изменения placement. */
export interface OrthogonalRoutingOutput {
  readonly edges: readonly Readonly<{id: string; points: readonly LayoutPoint[]}>[]
  readonly failures: readonly Readonly<{
    id: string
    reason: "EDGE_BUDGET" | "FALLBACK_BUDGET" | "OBSTACLE_BUDGET" | "GRID_BUDGET" | "SEARCH_BUDGET" | "SEARCH_FAILED"
  }>[]
  /** Bounds всех исходных карточек и принятых маршрутов. */
  readonly bounds: LayoutRectangle
  readonly fallbackAttempts: number
  /** Размер общей сетки; при GRID_BUDGET массивы этого размера не создаются. */
  readonly gridPoints: number
  /** Число раскрытий поиска, ограниченное maxSearchSteps. */
  readonly searchSteps: number
}
