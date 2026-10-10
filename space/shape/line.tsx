import {resolveTransform, type TransformProps} from "../src/props.ts"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {
  XRLineElement,
  XRObjectProjectionFactory,
} from "@zavx0z/immersive-space"
import type {SpaceRef} from "@zavx0z/immersive-space"
import "@zavx0z/immersive-space"

export type LineProps = TransformProps & Readonly<{
  visible?: boolean
  name?: string
  factory?: XRObjectProjectionFactory | null
  ref?: SpaceRef<XRLineElement> | null
}>

export function Line(props: LineProps): JSX.Element {
  const quaternion = resolveTransform(props)
  return (
    <xr-line
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
    </xr-line>
  )
}
