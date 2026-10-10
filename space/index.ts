/**
Пространственные возможности и готовые авторские компоненты Immersive.
Базовые фабрики DOM сохраняют отдельный вход без компонентного runtime.

@packageDocumentation
*/
export * from "./src/index.ts"
export {Grid} from "./gizmo/grid.tsx"
export type {GridProps} from "./gizmo/grid.tsx"

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
} from "./src/jsx.ts"
