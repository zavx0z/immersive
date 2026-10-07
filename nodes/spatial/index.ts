/**
Подписи, связи и геометрия размещения Display в существующем Space.
Прикладные поверхности и их оформление принадлежат приложению.

@packageDocumentation
*/
export {SpatialGraph} from "./src/index.tsx"
export {
  spatialContentBounds,
  spatialGraphBounds,
  SPATIAL_GRAPH_MILLIMETERS_PER_PIXEL,
  SPATIAL_GRAPH_CONTENT_SURFACE,
  SPATIAL_GRAPH_NODE_SIZE,
} from "./src/geometry.ts"
export type {SpatialGraphProps} from "./contract/input.ts"
export type {SpatialGraphNode} from "./contract/node.ts"
export type {SpatialGraphDimensions} from "./contract/dimensions.ts"
