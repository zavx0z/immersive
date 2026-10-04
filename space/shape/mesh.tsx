import {resolveTransform, type TransformProps} from "../src/props.ts"
import type {JSX} from "@immersive-jsx-compiler/session"
import type {
  XRMeshElement,
  XRObjectProjectionFactory,
} from "../src/elements.ts"
import type {SpaceRef} from "../src/jsx.ts"
import "../src/jsx.ts"

export type MeshProps = TransformProps & Readonly<{
  visible?: boolean
  name?: string
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
      factory={props.factory}
      ref={props.ref}
    >
      <slot />
    </xr-mesh>
  )
}
