import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {
  XRGeometryElement,
  XRGeometryProjectionFactory,
} from "@zavx0z/immersive-space"
import type {SpaceRef} from "@zavx0z/immersive-space"
import "@zavx0z/immersive-space"

export type GeometryProps = Readonly<{
  kind?: string
  width?: number
  height?: number
  depth?: number
  radius?: number
  tube?: number
  widthSegments?: number
  heightSegments?: number
  depthSegments?: number
  radialSegments?: number
  tubularSegments?: number
  factory?: XRGeometryProjectionFactory | null
  ref?: SpaceRef<XRGeometryElement> | null
}>

export function Geometry(props: GeometryProps): JSX.Element {
  return (
    <xr-geometry
      kind={props.kind}
      width={props.width}
      height={props.height}
      depth={props.depth}
      radius={props.radius}
      tube={props.tube}
      widthSegments={props.widthSegments}
      heightSegments={props.heightSegments}
      depthSegments={props.depthSegments}
      radialSegments={props.radialSegments}
      tubularSegments={props.tubularSegments}
      factory={props.factory}
      ref={props.ref}
    />
  )
}
