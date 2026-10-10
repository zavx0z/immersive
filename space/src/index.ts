export {
  XRAnimationElement,
  XRAssetElement,
  XRElement,
  XRGeometryElement,
  XRGroupElement,
  XRLightElement,
  XRLineElement,
  XRLineSegmentsElement,
  XRMaterialElement,
  XRMeshElement,
  XRObjectElement,
  XRTextElement,
} from "./elements.ts"
export type {
  XRAnimationProjectionFactory,
  XRGeometryProjectionFactory,
  XRMaterialProjectionFactory,
  XRMaterialProjectionContext,
  XRObjectProjectionContext,
  XRObjectProjectionFactory,
} from "./elements.ts"
export {createSpaceElementFactories} from "./factories.ts"
export {readSpaceTree} from "./tree.ts"
export type {
  SpaceHUDProjection,
  SpaceTree,
} from "./tree.ts"


export type {SpatialVector, SpatialQuaternion, OrientationProps, TransformProps} from "./props.ts"

export type {SpatialRay} from "../contract/spatial-ray.ts"
export type {SpatialHit} from "../contract/spatial-hit.ts"
export type {SpatialHitTest} from "../contract/spatial-hit-test.ts"
export {bindSpatialHit, readSpatialHit} from "./spatial-event.ts"
