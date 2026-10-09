import type {SpatialVector} from "../../../src/props.ts"

/** Осевой габарит в XYZ, мм: точный для cubic и консервативный для округлённых перегибов. */
export type SpatialEdgeBounds = Readonly<{min: SpatialVector; max: SpatialVector}>
