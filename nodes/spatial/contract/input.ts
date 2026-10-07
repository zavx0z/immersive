import type {GraphLink, GraphRect} from "../../shared/graph/contracts.ts"
import type {SpatialGraphNode} from "./node"
import type {SpatialGraphDimensions} from "./dimensions"

/**
Представление готового графа в существующем Space того же Document.
Все подписи и связи сохраняются независимо от загрузки прикладного UI.
Приложение размещает собственные Display через spatialContentBounds и управляет камерой.
*/
export type SpatialGraphProps = SpatialGraphDimensions & Readonly<{
  bounds: GraphRect
  nodes: readonly SpatialGraphNode[]
  links: readonly GraphLink[]
  selectedId?: string | null | undefined
  onSelect?: ((id: string, event: Event) => void) | undefined
}>
