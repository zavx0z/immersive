import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {
  XRAnimationElement,
  XRAnimationProjectionFactory,
} from "@zavx0z/immersive-space"
import type {SpaceRef} from "@zavx0z/immersive-space"
import "@zavx0z/immersive-space"

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
