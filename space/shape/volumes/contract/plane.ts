import type {SpatialVector} from "../../../src/props.ts"

/** Четыре согласованных XYZ-угла либо горизонтальный XY-прямоугольник Layout, мм. */
export type SpatialVolumePlane =
  | readonly [SpatialVector, SpatialVector, SpatialVector, SpatialVector]
  | Readonly<{x: number; y: number; z: number; width: number; height: number}>
