import type {JSX} from "@immersive-jsx-compiler/session"
import type {
  XRGeometryElement,
  XRGeometryProjectionFactory,
} from "../src/elements.ts"
import type {SpaceRef} from "../src/jsx.ts"
import "../src/jsx.ts"

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
