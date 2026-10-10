import type {} from "@zavx0z/immersive-space/components"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import {useState, useEffect, useLayoutEffect} from "@zavx0z/immersive-component/authoring"
import {useSpace, useFrame} from "@zavx0z/immersive-browser/authoring"
import type {SpaceElement} from "@zavx0z/immersive-dom/space"
import type {FrameState} from "../src/document-environment.ts"

declare module "@zavx0z/immersive-jsx-compiler-session" {
  namespace JSX {
    interface IntrinsicElements { "scene-fragment": {id?: string, children?: JSX.Child} }
  }
}

export function TestApp() { return <space><viewpoint /></space> }
export function MissingCamera() { return <space /> }
export function AuthoredApp(props: {onMount: (space: SpaceElement) => () => void}) {
  return <space id="authored-space" ref={element => element ? props.onMount(element) : undefined}><viewpoint x={42} z={300} /></space>
}
export function ResizeApp(props: {width: (width: number) => void, frame: (frame: FrameState, delta: number) => void}) {
  const size = useSpace(state => state.size)
  props.width(size.width)
  useFrame(props.frame)
  return <space><viewpoint /></space>
}
export function StableSelection(props: {rendered: () => void}) {
  useSpace(state => state.frameloop)
  props.rendered()
  return <space><viewpoint /></space>
}
export function BrowserCounter(props: {label: string, frameloop: "demand" | "always", increment: (callback: () => void) => void}) {
  const [count, setCount] = useState(0)
  useLayoutEffect(() => { props.increment(() => setCount(value => value + 1)) }, [])
  return <><link rel="stylesheet" href="/dark.css" /><space frameloop={props.frameloop}><viewpoint /><hud>{props.label}:{count}</hud></space></>
}
export function PendingLabel(props: {label: string}) { return <space><viewpoint /><hud>{props.label}</hud></space> }
export function CleanupOrder(props: {cleanup: () => void}) {
  useLayoutEffect(() => props.cleanup, [])
  return <space><viewpoint /></space>
}
export function NativeScene(props: {rendered: () => void, mounted: () => void, cleaned: () => void, frame: () => void}) {
  const [count, setCount] = useState(0)
  const width = useSpace(state => state.size.width)
  props.rendered()
  useFrame(props.frame)
  useEffect(() => { props.mounted(); return props.cleaned }, [])
  return <space><scene-fragment><scene-fragment><viewpoint /></scene-fragment>
    <xr-group name="first"><scene-fragment id="mesh-host"><xr-mesh name="cube"><scene-fragment id="resources"><xr-geometry /><xr-material /></scene-fragment></xr-mesh></scene-fragment></xr-group>
    <xr-group name="second" />
    <scene-fragment id="display-host"><display width={254} height={254} style={css`width:960px;height:960px`}><button onClick={() => setCount(value => value + 1)}>{width}:{count}</button></display></scene-fragment>
  </scene-fragment></space>
}
