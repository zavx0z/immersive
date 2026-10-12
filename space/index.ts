/**
Пространственные возможности и готовые авторские компоненты Immersive.
Базовые фабрики DOM сохраняют отдельный вход без компонентного runtime.

@packageDocumentation
*/
export * from "@zavx0z/immersive-space"
export {Grid} from "@zavx0z/immersive-space/gizmo/grid"
export type {GridProps} from "@zavx0z/immersive-space/gizmo/grid"
export {SpatialEdges, spatialEdgeBounds, tessellateSpatialEdge} from "@zavx0z/immersive-space/shape/edges"
export type {SpatialEdgesProps, SpatialEdge, SpatialEdgeRoute, SpatialEdgeBounds} from "@zavx0z/immersive-space/shape/edges"

export type {
  SpaceRef,
  XRAnimationIntrinsicProperties,
  XRAssetIntrinsicProperties,
  XRGeometryIntrinsicProperties,
  XRGroupIntrinsicProperties,
  XRLightIntrinsicProperties,
  XRLineIntrinsicProperties,
  XRLineSegmentsIntrinsicProperties,
  XRMaterialIntrinsicProperties,
  XRMeshIntrinsicProperties,
  XRObjectIntrinsicProperties,
  XRTextIntrinsicProperties,
} from "@zavx0z/immersive-space"
