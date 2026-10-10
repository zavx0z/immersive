import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {
  XRMaterialElement,
  XRMaterialProjectionFactory,
} from "@zavx0z/immersive-space"
import type {SpaceRef} from "@zavx0z/immersive-space"
import "@zavx0z/immersive-space"

export type MaterialProps = Readonly<{
  kind?: string
  color?: string
  style?: CssStyle
  styleProperties?: readonly string[]
  factory?: XRMaterialProjectionFactory | null
  ref?: SpaceRef<XRMaterialElement> | null
}>

export function Material(props: MaterialProps): JSX.Element {
  return (
    <xr-material
      kind={props.kind}
      color={props.color}
      style={props.style}
      styleProperties={props.styleProperties}
      factory={props.factory}
      ref={props.ref}
    />
  )
}
