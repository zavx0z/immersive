import type {GraphRect} from "../../shared/graph/contracts.ts"

/** Нода с готовым габаритом графа; содержимое Display принадлежит приложению. */
export type SpatialGraphNode = Readonly<{
  id: string
  title: string
  rect: GraphRect
}>
