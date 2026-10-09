import {resolveTransform, type TransformProps} from "../src/props.ts"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {
  XRGroupElement,
  XRObjectProjectionFactory,
} from "../src/elements.ts"
import type {SpaceRef} from "../src/jsx.ts"
import "../src/jsx.ts"

export type GroupProps = TransformProps & Readonly<{
  visible?: boolean
  name?: string
  style?: CssStyle
  factory?: XRObjectProjectionFactory | null
  ref?: SpaceRef<XRGroupElement> | null
}>

export function Group(props: GroupProps): JSX.Element {
  const quaternion = resolveTransform(props)
  return (
    <xr-group
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
    </xr-group>
  )
}
