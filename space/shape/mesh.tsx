import {resolveTransform, type TransformProps} from "../src/props.ts"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {
  XRMeshElement,
  XRObjectProjectionFactory,
} from "@zavx0z/immersive-space"
import type {SpaceRef} from "@zavx0z/immersive-space"
import "@zavx0z/immersive-space"

export type MeshProps = TransformProps & Readonly<{
  visible?: boolean
  name?: string
  style?: CssStyle
  factory?: XRObjectProjectionFactory | null
  ref?: SpaceRef<XRMeshElement> | null
}>

export function Mesh(props: MeshProps): JSX.Element {
  const quaternion = resolveTransform(props)
  return (
    <xr-mesh
      x={props.position?.x}
      y={props.position?.y}
      z={props.position?.z}
      quaternionX={quaternion?.x}
      quaternionY={quaternion?.y}
      quaternionZ={quaternion?.z}
      quaternionW={quaternion?.w}
      scaleX={props.scale?.x}
      scaleY={props.scale?.y}
      scaleZ={props.scale?.z}
      visible={props.visible}
      name={props.name}
      style={props.style}
      factory={props.factory}
      ref={props.ref}
    >
      <slot />
    </xr-mesh>
  )
}
