import type {JSX} from "@jsx-compiler/session"
import type {
  XRMaterialElement,
  XRMaterialProjectionFactory,
} from "../src/elements.ts"
import type {SpaceRef} from "../src/jsx.ts"
import "../src/jsx.ts"

export type MaterialProps = Readonly<{
  kind?: string
  color?: string
  factory?: XRMaterialProjectionFactory | null
  ref?: SpaceRef<XRMaterialElement> | null
}>

export function Material(props: MaterialProps): JSX.Element {
  return (
    <xr-material
      kind={props.kind}
      color={props.color}
      factory={props.factory}
      ref={props.ref}
    />
  )
}
