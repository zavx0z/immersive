import type {SpatialEdgeRoute} from "./route.ts"

/** Адрес связи и готовый мировой маршрут; endpoints разрешает владелец модели. */
export type SpatialEdge = Readonly<{
  id: string
  route: SpatialEdgeRoute
  /** RGB в формате 0xRRGGBB. */
  color?: number | undefined
  hidden?: boolean | undefined
  disabled?: boolean | undefined
}>
