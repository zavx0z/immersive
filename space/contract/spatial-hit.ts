import type {SpatialVector} from "../src/props.ts"

/** Адрес части пространственного объекта и точка ближайшего попадания в мм. */
export type SpatialHit = Readonly<{id: string; distance: number; point: SpatialVector}>
