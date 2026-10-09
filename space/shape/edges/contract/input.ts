import type {XRLineSegmentsElement} from "../../../src/elements.ts"
import type {SpaceRef} from "../../../src/jsx.ts"
import type {SpatialEdge} from "./edge.ts"

/** Один общий batch мировых рёбер внутри существующего Space. */
export type SpatialEdgesProps = Readonly<{
  edges: readonly SpatialEdge[]
  /** Материализуемая часть общего кеша маршрутов; смена набора не перестраивает маршруты. */
  visibleIds?: ReadonlySet<string> | readonly string[] | undefined
  /** Изменять при изменении маршрутов или состава; без ревизии edges должны быть immutable. */
  geometryRevision?: string | number | undefined
  /** Радиус попадания луча в мм; по умолчанию 2. */
  hitTolerance?: number | undefined
  onActivate?: ((id: string, event: MouseEvent) => void) | undefined
  selectedId?: string | null | undefined
  selectedColor?: number | undefined
  visible?: boolean | undefined
  name?: string | undefined
  ref?: SpaceRef<XRLineSegmentsElement> | null | undefined
}>
