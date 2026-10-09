import type {SpatialVector} from "../src/props.ts"

/** Луч ввода в XYZ общего Space; direction нормализуется проверкой попадания. */
export type SpatialRay = Readonly<{origin: SpatialVector; direction: SpatialVector}>
