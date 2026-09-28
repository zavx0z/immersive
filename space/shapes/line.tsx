import {resolveTransform, type TransformProps} from "../src/props.ts"
import type {JSX} from "@jsx/types"
import type {
  XRLineElement,
  XRObjectProjectionFactory,
} from "../src/elements.ts"
import type {SpaceRef} from "../src/jsx.ts"
import "../src/jsx.ts"

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
