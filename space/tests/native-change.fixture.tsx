import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {XRObjectProjectionFactory, SpatialHitTest} from "@zavx0z/immersive-space"

export type NativeMeshProps = {
  quaternionX: number
  scaleX: number
  factory: XRObjectProjectionFactory | null
  hitTest: SpatialHitTest | null
}

export function NativeMesh(props: NativeMeshProps): JSX.Element {
  return <xr-mesh
    quaternionX={props.quaternionX}
    scaleX={props.scaleX}
    factory={props.factory}
    hitTest={props.hitTest}
    data-derived={`${props.quaternionX}:${props.scaleX}:${props.factory?.name ?? "none"}:${props.hitTest?.name ?? "none"}`}
  />
}
