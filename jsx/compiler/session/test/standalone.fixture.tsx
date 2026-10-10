import {component, createContext, memo, provideContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore} from "@zavx0z/immersive-component"
import type {JSX} from "../index.ts"
import {createDomRoot} from "@zavx0z/immersive-dom"
import type {DOMSlotContent, Element as DOMElement} from "@zavx0z/immersive-dom"

export function Counter(props: {label: string, mount: () => void, cleanup: () => void}) {
  const [count, setCount] = useState(0)
  const element = useRef<HTMLButtonElement | null>(null)
  useLayoutEffect(() => {
    if (!element.current?.isConnected) throw new Error("Expected connected authored root")
    props.mount()
    return props.cleanup
  }, [])
  return <button
    ref={element}
    onClick={() => setCount(value => value + 1)}
    title={props.label}
  >{props.label}:{count}</button>
}

function useCount(initial: number) {
  const [count, setCount] = useState(initial)
  const doubled = useMemo(() => count * 2, [count])
  return {count, doubled, increment: () => setCount(value => value + 1)}
}

export function CustomCounter(props: {initial: number}) {
  const counter = useCount(props.initial)
  return <button onClick={counter.increment}>{counter.count}:{counter.doubled}</button>
}

export function TwoCustomCounters() {
  const first = useCount(1)
  const second = useCount(10)
  return <div><button onClick={first.increment}>{first.count}</button><button onClick={second.increment}>{second.count}</button></div>
}

export function Pane(): JSX.Element<{header: JSX.Element, default: JSX.Element}> {
  return <section><header><slot name="header" /></header><main><slot /></main></section>
}

export function NamedSlots(props: {label: string, mount: () => void, cleanup: () => void}) {
  return <Pane><Counter slot="header" label={props.label} mount={props.mount} cleanup={props.cleanup} /><CustomCounter initial={2} /></Pane>
}

export function Rows(props: {rows: readonly {id: string, value: number}[]}) {
  return <>{props.rows.map(row => <CustomCounter key={row.id} initial={row.value} />)}</>
}

export function ComponentRoot(props: {initial: number}) {
  return <CustomCounter initial={props.initial} />
}

export function RootSlot() {
  return <slot />
}

export const Theme = createContext("default")
export function Consumer() {
  const value = useContext(Theme)
  return <span>{value}</span>
}
export function preparedContext(value: string) {
  return provideContext(Theme, value, component(Consumer, {}))
}
export const MemoConsumer = memo(Consumer)

export function Store(props: {subscribe: (listener: () => void) => () => void, getSnapshot: () => string}) {
  const value = useSyncExternalStore(props.subscribe, props.getSnapshot)
  return <span>{value}</span>
}

export function Atomic(props: {label: string, mount: () => void, cleanup: () => void}) {
  return <section><Counter label={props.label} mount={props.mount} cleanup={props.cleanup} /><space><slot /></space></section>
}

export const TopLevel = <CustomCounter initial={4} />

export function createInline(value: string) {
  return <><span title={value}>{value}</span><CustomCounter initial={5} /></>
}

export function renderInto(host: {render(value: unknown): void}, value: number) {
  host.render(<CustomCounter initial={value} />)
}

export function NativeInputs(props: {disabled?: boolean, tabIndex?: number, label: string}) {
  const [count, setCount] = useState(0)
  return <button
    disabled={props.disabled === true}
    tabIndex={props.tabIndex ?? 0}
    onClick={() => setCount(value => value + 1)}
  >{props.label}:{count}:{String(props.disabled)}:{String(props.tabIndex)}</button>
}

export function RefChild(props: {element: {current: HTMLSpanElement | null}}) {
  return <span ref={props.element}>child</span>
}

export function RefParent(props: {read: (element: HTMLSpanElement | null) => void}) {
  const child = useRef<HTMLSpanElement | null>(null)
  useLayoutEffect(() => { props.read(child.current) }, [])
  return <div><RefChild element={child} /></div>
}

export function WholeProps(props: {label: string, read: (value: object) => void}) {
  const [count, setCount] = useState(0)
  useLayoutEffect(() => { props.read(props) }, [props])
  return <button onClick={() => setCount(value => value + 1)}>{props.label}:{count}</button>
}

export const MemoWholeProps = memo(WholeProps, (previous, next) => previous.label === next.label)

export function RawChild() {
  return <div><slot /></div>
}

export function RawAtomic(props: {invalid: boolean}) {
  return <section>
    <RawChild><slot /></RawChild>
    <span title={props.invalid ? {} as never : "accepted"} />
  </section>
}

export function FactoryCounter(props: {label: string}) {
  const [count, setCount] = useState(0)
  return <section title={props.label} onClick={() => setCount(value => value + 1)}>{props.label}:{count}</section>
}
export const MemoFactoryCounter = memo(FactoryCounter)

export function EventThis(props: {handler: (this: unknown, event: unknown) => void}) {
  return <button onClick={props.handler}>event</button>
}

export function MissingNativeInput(props: {disabled?: boolean}) {
  return <button disabled={props.disabled ?? true}>{String(props.disabled)}</button>
}

export function StoredSocket(props: {label: string}) {
  return <span data-socket={props.label}>{props.label}</span>
}

export function StoredReceiver(): JSX.Element<{left: readonly typeof StoredSocket[], default: JSX.Element}> {
  return <section><header><slot name="left" /></header><main><slot /></main></section>
}

const storedVariants = ["first", "next"].map(label => ({
  slots: {someAlias: <StoredSocket slot="left" label={label} />},
  body: <span>{label}</span>,
}))

export function renderStoredVariants(host: {render(value: unknown): void}) {
  storedVariants.forEach(({slots, body}) => host.render(<StoredReceiver>{slots.someAlias}{body}</StoredReceiver>))
}

type ReviewLifecycle = {mount(id: string): void, cleanup(id: string): void}
export function ReviewRow(props: {id: string, lifecycle: ReviewLifecycle}) {
  const [count, setCount] = useState(0)
  useEffect(() => { props.lifecycle.mount(props.id); return () => props.lifecycle.cleanup(props.id) }, [])
  return <button onClick={() => setCount(value => value + 1)}>{props.id}:{count}</button>
}
export function ReviewRows(props: {rows: readonly string[], lifecycle: ReviewLifecycle}) {
  return <div>{props.rows.map(id => <ReviewRow key={id} id={id} lifecycle={props.lifecycle} />)}</div>
}
export function StaticReviewChild(props: {lifecycle: ReviewLifecycle}) {
  return <section><ReviewRow id="child" lifecycle={props.lifecycle} /></section>
}
export function DynamicReviewChild(props: {visible: boolean, lifecycle: ReviewLifecycle}) {
  return <section>{props.visible ? <ReviewRow id="child" lifecycle={props.lifecycle} /> : null}</section>
}
export function FragmentContent(props: {content: DOMSlotContent, label: string}) {
  return <div title={props.label}>{props.content}</div>
}
export function Hygienic(inputs: {value: string}) {
  const authoredProps = inputs.value
  const phases = authoredProps + ":"
  const nextProps = phases + "safe"
  const __zComp0Local_inputs = nextProps
  return <span>{__zComp0Local_inputs}</span>
}
function useScope(context: string, getSlotContent: number) {
  const inputs = useMemo(() => context, [context])
  return inputs + getSlotContent
}
export function HookScope(props: {value: string}) {
  const value = useScope(props.value, 1)
  return <span>{value}</span>
}
const initialProps = "default"
export function HygienicDefault(props = {label: initialProps}) {
  return <span>{props.label}</span>
}

type SpreadInput = {label?: string, content?: string, key?: string | number}
export function SpreadLeaf(props: {label: string, content?: string}) {
  const [count, setCount] = useState(0)
  return (
    <span onClick={() => setCount(value => value + 1)}>
      {props.label}:{props.content ?? ""}:{count}
    </span>
  )
}
export function spreadValue(events: string[], first: () => SpreadInput, last: () => SpreadInput, label: string) {
  const mark = (name: string, value: string) => { events.push(name); return value }
  return (
    <SpreadLeaf
      content={mark("content", "first")}
      {...first()}
      key={mark("key", "explicit")}
      {...last()}
      label={mark("label", label)}
    />
  )
}
export function spreadRoot(parent: DOMElement, input: {label: string, key?: string}) {
  const root = createDomRoot(parent)
  root.render(
    <SpreadLeaf {...input} />
  )
  return root
}
export function SpreadPane(props: {id: string}): JSX.Element<{header: JSX.Element, default: JSX.Element}> {
  return (
    <section data-id={props.id}>
      <header>
        <slot name="header" />
      </header>
      <main>
        <slot />
      </main>
    </section>
  )
}
export function spreadPane(events: string[], inputs: () => {id: string}) {
  const child = (name: string) => { events.push(name); return name }
  return (
    <SpreadPane {...inputs()}>
      <SpreadLeaf slot="header" label={child("header")} />
      <SpreadLeaf label={child("body")} />
    </SpreadPane>
  )
}
export function spreadReserved(input: Record<string, unknown>) {
  return (
    <SpreadLeaf {...input} label="reserved" />
  )
}
export function spreadAssigned(input: Record<string, unknown>) {
  return (
    <SpreadPane id="assigned">
      <SpreadLeaf slot="header" {...input} label="header" />
      <SpreadLeaf label="body" />
    </SpreadPane>
  )
}

export function PropsObservation(props: {label: string, [name: string]: unknown, [name: symbol]: unknown}) {
  const first = props.label
  const second = props.label
  return (
    <span>{first}:{second}</span>
  )
}

export function LiveNativeReads(props: {disabled?: boolean, mutate?: (node: HTMLButtonElement | null) => void, report?: (before: string, after: string) => void}) {
  const element = useRef<HTMLButtonElement | null>(null)
  const before = String(props.disabled)
  props.mutate?.(element.current)
  const after = String(props.disabled)
  props.report?.(before, after)
  return (
    <button ref={element} disabled={props.disabled === true}>
      {after}
    </button>
  )
}

export function GetterAtomic(props: {value: number, title: string, extra?: string}) {
  const [count, setCount] = useState(0)
  return (
    <span title={props.title} onClick={() => setCount(value => value + 1)}>
      {props.value}:{count}
    </span>
  )
}
