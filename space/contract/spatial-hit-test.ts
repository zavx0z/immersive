import type {SpatialRay} from "./spatial-ray.ts"
import type {SpatialHit} from "./spatial-hit.ts"

/** Геометрический hit-test в общем Space; не генерирует события и не владеет вводом. */
export type SpatialHitTest = (ray: SpatialRay) => SpatialHit | null
