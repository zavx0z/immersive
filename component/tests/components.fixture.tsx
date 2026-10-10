import {createContext, useContext, useDocument, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from "@zavx0z/immersive-component/authoring"
import hasSlot from "@zavx0z/immersive-component/slot-presence"
import composeSlot from "@zavx0z/immersive-component/slot"
import type {DOMSlotContent, Element as SemanticElement} from "@zavx0z/immersive-dom"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

export function Counter(props: {
  label: string
  lifecycle?: {setups: number, cleanups: number, dispatch?: ((value: number) => void) | null}
  element?: {current: HTMLButtonElement | null}
  mounted?: (document: unknown) => void
}) {
  const document = useDocument()
  const [count, dispatch] = useState(0)
  if (props.lifecycle) props.lifecycle.dispatch = dispatch
  useEffect(() => {
    if (props.lifecycle) props.lifecycle.setups++
    props.mounted?.(document)
    return () => { if (props.lifecycle) props.lifecycle.cleanups++ }
  }, [])
  return <button
    ref={props.element}
    id={props.label}
    onClick={() => dispatch(value => value + 1)}
  >{props.label}:{count}</button>
}

export function Pane(): JSX.Element<{header: JSX.Element, default: JSX.Element}> {
  return <div data-pane="">
    <header><slot name="header" /></header>
    <main><slot>fallback</slot></main>
  </div>
}

export function Plain(props: {value: string}) {
  return <span>{props.value}</span>
}

export function TextOnly(props: {value: string}) {
  return <>{props.value}</>
}

export function Pair(props: {value: string}) {
  const [count, setCount] = useState(0)
  return <>
    <button onClick={() => setCount(value => value + 1)}>{props.value}:{count}</button>
    <span>tail</span>
  </>
}

export function SlotHost(props: {content: DOMSlotContent, fallback?: DOMSlotContent}) {
  const content = composeSlot({content: props.content}) ?? props.fallback ?? null
  return <>{content}</>
}

export function Presence(props: {selected?: string}): JSX.Element<{header: JSX.Element, default: JSX.Element}> {
  const presence = JSON.stringify({body: hasSlot(), header: hasSlot(props.selected ?? "header")})
  return <article>{presence}<slot>fallback</slot><slot name="header" /></article>
}

export const Theme = createContext("default")
export function ContextText(props: {suffix?: string}) {
  const value = useContext(Theme)
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(value => value + 1)}>{value}:{props.suffix ?? ""}:{count}</button>
}

export function Store(props: {subscribe: (listener: () => void) => () => void, getSnapshot: () => string}) {
  const value = useSyncExternalStore(props.subscribe, props.getSnapshot)
  return <span>{value}</span>
}

export function NativeInput(props: {value: string, checked?: boolean, element?: {current: HTMLInputElement | null}}) {
  return <input value={props.value} checked={props.checked === true} ref={props.element} />
}

export function NativeButton(props: {label: string, element?: unknown}) {
  return <button ref={props.element as never}>{props.label}</button>
}

export function Atomic(props: {label: string, lifecycle: {setups: number, cleanups: number}}) {
  return <section>
    <Counter label={props.label} lifecycle={props.lifecycle} />
    <space><slot /></space>
  </section>
}

export function ConnectedRef(props: {onLayout: (element: unknown) => void, element?: {current: HTMLButtonElement | null}}) {
  const element = useRef<HTMLButtonElement | null>(null)
  useLayoutEffect(() => { props.onLayout(element.current) }, [])
  return <button ref={node => {
    element.current = node
    const external = props.element
    if (external) external.current = node
    return () => {
      if (element.current === node) element.current = null
      if (external?.current === node) external.current = null
    }
  }}>connected</button>
}

export function Failure(props: {reject: boolean, value: string} = {reject: true, value: ""}) {
  if (props.reject) throw new Error("rejected input")
  return <button>{props.value}</button>
}

export function prepareSlot(content: DOMSlotContent) {
  return composeSlot({content})
}

export function AtomicOther(props: {label: string, lifecycle: {setups: number, cleanups: number}}) {
  return <section>
    <Counter label={props.label} lifecycle={props.lifecycle} />
    <space><slot /></space>
  </section>
}

interface TestObjectTarget extends SemanticElement { x: number }
declare module "@zavx0z/immersive-jsx-compiler-session" {
  namespace JSX {
    interface IntrinsicElements {
      "test-object": JSX.IntrinsicProperties<TestObjectTarget>
    }
  }
}
export function SpatialHost(props: {x?: number, text: unknown, ref?: unknown}) {
  return <>
    <test-object x={props.x} ref={props.ref as never} />
    {props.text as string}
  </>
}

export const lifecycleEvents: [string, string][] = []
export function StatefulPane(props: {
  title?: string
  id?: string
  lifecycle?: {mounts: number, cleanups: number}
  gate?: {reject: boolean}
}): JSX.Element<{header: JSX.Element, default: JSX.Element}> {
  if (props.title === "bad") throw new Error("Initial render rejected")
  if (props.gate?.reject) throw new Error("Rejected component input")
  const element = useRef<HTMLDivElement | null>(null)
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (props.lifecycle) props.lifecycle.mounts++
    lifecycleEvents.push(["mount", element.current?.id ?? ""])
    return () => {
      if (props.lifecycle) props.lifecycle.cleanups++
      lifecycleEvents.push(["cleanup", element.current?.id ?? ""])
    }
  }, [])
  return <div
    id={props.id}
    title={props.title}
    ref={element}
    data-pane=""
    onClick={() => setCount(value => value + 1)}
  >
    <h2>{props.title || "Default"}:{count}</h2>
    <header><slot name="header" /></header>
    <main><slot>Пусто</slot></main>
  </div>
}

export function Cleanup(props: {cleanup: () => void}) {
  useEffect(() => props.cleanup, [])
  return <b>cleanup</b>
}
