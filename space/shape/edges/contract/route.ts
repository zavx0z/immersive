import type {SpatialVector} from "../../../src/props.ts"

/** Маршрут в XYZ общего Space, мм; изгиб не зависит от ViewPoint. */
export type SpatialEdgeRoute =
  | Readonly<{
      kind: "polyline"
      points: readonly SpatialVector[]
      /** Максимальное расстояние среза от вершины перегиба в мм; по умолчанию 0. */
      cornerRadius?: number | undefined
      /** Число отрезков quadratic-перегиба, от 1 до 64; по умолчанию 4. */
      cornerSegments?: number | undefined
    }>
  | Readonly<{
      kind: "cubic"
      points: readonly [SpatialVector, SpatialVector, SpatialVector, SpatialVector]
      /** Число отрезков аппроксимации, от 1 до 4096; по умолчанию 32. */
      segments?: number | undefined
    }>
