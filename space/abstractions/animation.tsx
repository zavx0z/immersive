import type {JSX} from "@jsx/types"
import type {
  XRAnimationElement,
  XRAnimationProjectionFactory,
} from "../src/elements.ts"
import type {SpaceRef} from "../src/jsx.ts"
import "../src/jsx.ts"

export type AnimationProps = Readonly<{
  factory: XRAnimationProjectionFactory
  playing?: boolean
  loop?: boolean
  timeScale?: number
  ref?: SpaceRef<XRAnimationElement> | null
}>

export function Animation(props: AnimationProps): JSX.Element {
  return (
    <xr-animation
      factory={props.factory}
      playing={props.playing}
      loop={props.loop}
      timeScale={props.timeScale}
      ref={props.ref}
    />
  )
}
