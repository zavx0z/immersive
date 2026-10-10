import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createDocument, createDomRoot, DOMGroup, HTMLButtonElement, HTMLElement, type Document, Event} from "@zavx0z/immersive-dom"
import {DisplayElement} from "@zavx0z/immersive-dom/display"
import JsxCompilerSession from "../index.ts"

test("standalone Counter — сам authored button, без XReact runtime и дополнительного host", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".standalone-"))
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})
  try {
    const compiled = await compiler.compileFile(join(import.meta.dir, "standalone.fixture.tsx"))
    const executable = new Bun.Transpiler({loader: "ts"}).transformSync(compiled.code)
    expect(/from ["']@zavx0z\/immersive(?:\/XReact|-component|-template)/.test(executable)).toBeFalse()
    expect(compiled.code).not.toMatch(/defineCompiledTemplate|currentInstance|HostBinding|writeBinding/)
    const path = join(directory, "counter.ts")
    await Bun.write(path, compiled.code)
    const {Counter} = await import(pathToFileURL(path).href)
    const document = createDocument()
    const host = document.createElement("div")
    document.append(host)
    let mounts = 0
    let cleanups = 0
    const props = {label: "First", mount: () => { mounts++ }, cleanup: () => { cleanups++ }}
    const counter = new Counter(document, props)
    expect(counter).toBeInstanceOf(HTMLButtonElement)
    expect(counter.localName).toBe("button")
    expect(counter.textContent).toBe("First:0")
    host.append(counter)
    expect(host.children).toHaveLength(1)
    counter.dispatchEvent(new Event("click"))
    expect(counter.textContent).toBe("First:1")
    counter.props = {...props, label: "Next"}
    expect(counter.textContent).toBe("Next:1")
    expect(counter.title).toBe("Next")
    expect([mounts, cleanups]).toEqual([1, 0])
    counter.remove()
    expect(cleanups).toBe(1)
    host.append(counter)
    expect(counter.textContent).toBe("Next:1")
    expect(mounts).toBe(2)
    counter.dispose()
    expect(cleanups).toBe(2)
  } finally {
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

async function withCompiled(run: (module: Record<string, any>) => void) {
  const directory = await mkdtemp(join(import.meta.dir, ".standalone-"))
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})
  try {
    const compiled = await compiler.compileFile(join(import.meta.dir, "standalone.fixture.tsx"))
    const path = join(directory, "components.ts")
    await Bun.write(path, compiled.code)
    run(await import(pathToFileURL(path).href))
  } finally {
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}

test("shared DOM event binding сохраняет this=currentTarget и принятый handler после rejected update", () => withCompiled(({EventThis}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const calls: unknown[] = []
  function first(this: unknown, event: any) { calls.push([this, event.currentTarget]) }
  const node = new EventThis(document, {handler: first})
  host.append(node)
  node.dispatchEvent(new Event("click"))
  expect(calls).toEqual([[node, node]])
  expect(() => node.update({handler: 1})).toThrow("event binding")
  node.dispatchEvent(new Event("click"))
  expect(calls).toHaveLength(2)
  node.update({handler: function(this: unknown) { calls.push(this) }})
  node.dispatchEvent(new Event("click"))
  expect(calls[2] === node).toBeTrue()
  node.dispose()
  node.dispatchEvent(new Event("click"))
  expect(calls).toHaveLength(3)
}))

test("отсутствующий native input перестаёт быть missing после первого imperative изменения", () => withCompiled(({MissingNativeInput}) => {
  const document = createDocument()
  const node = new MissingNativeInput(document, {})
  expect(node.disabled).toBeTrue()
  expect(node.props.disabled).toBeUndefined()
  node.disabled = false
  expect(node.props.disabled).toBeFalse()
  expect(node.textContent).toBe("false")
  node.disabled = true
  expect(node.props.disabled).toBeTrue()
  expect(node.textContent).toBe("true")
  node.dispose()
}))

test("Storybook variants сохраняют static slot и concrete child identity через object/callback binding", () => withCompiled(({renderStoredVariants}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createDomRoot(host)
  try {
    renderStoredVariants(root)
    expect(host.querySelector("header")!.textContent).toBe("next")
    expect(host.querySelector("header [data-socket]")!.getAttribute("data-socket")).toBe("next")
    expect(host.querySelector("main")!.textContent).toBe("next")
  } finally { root.unmount() }
}))

test("cleanup error при keyed replacement завершает принятие новых props и очистку всех прежних детей", () => withCompiled(({ReviewRows}) => {
  const document = createDocument(), host = document.createElement("div")
  document.append(host)
  const mounts: string[] = [], cleanups: string[] = []
  const lifecycle = {mount: (id: string) => { mounts.push(id) }, cleanup: (id: string) => { cleanups.push(id); if (id === "a") throw new Error("Rejected cleanup") }}
  const node = new ReviewRows(document, {rows: ["a", "b"], lifecycle})
  host.append(node)
  expect(() => node.update({rows: ["c"], lifecycle})).toThrow("Rejected cleanup")
  expect(node.props.rows).toEqual(["c"])
  expect(cleanups).toEqual(["a", "b"])
  expect(mounts).toEqual(["a", "b", "c"])
  const child = host.querySelector("button")!
  child.dispatchEvent(new Event("click"))
  expect(host.textContent).toBe("c:1")
  node.update({rows: ["c"], lifecycle})
  expect(host.querySelector("button")).toBe(child)
  node.dispose()
  expect(cleanups).toEqual(["a", "b", "c"])
}))

test("cleanup generated static/dynamic range не уничтожает готовый child, переданный другому owner", () => withCompiled(({StaticReviewChild, DynamicReviewChild, RawChild}) => {
  for (const Constructor of [StaticReviewChild, DynamicReviewChild]) {
    const document = createDocument(), host = document.createElement("div"), target = document.createElement("aside")
    const body = document.createElement("body")
    document.append(body); body.append(host, target)
    let mounts = 0, cleanups = 0
    const parent = new Constructor(document, {visible: true, lifecycle: {mount() { mounts++ }, cleanup() { cleanups++ }}})
    host.append(parent)
    const child = host.querySelector("button") as HTMLButtonElement & {dispose(): void}
    child.dispatchEvent(new Event("click"))
    const receiver = createDomRoot(target)
    receiver.render(RawChild, {}, {content: {"": child}})
    expect([mounts, cleanups]).toEqual([1, 0])
    parent.dispose()
    expect(target.querySelector("button")).toBe(child)
    child.dispatchEvent(new Event("click"))
    expect(child.textContent).toBe("child:2")
    expect([mounts, cleanups]).toEqual([1, 0])
    receiver.unmount()
    child.dispose()
    expect(cleanups).toBe(1)
  }
}))

test("Fragment сохраняется только в текущем accepted input, clear и новое empty назначение не оживляют Nodes", () => withCompiled(({FragmentContent}) => {
  const document = createDocument(), fragment = document.createDocumentFragment()
  const raw = document.createElement("button")
  raw.textContent = "raw"
  fragment.append(raw)
  const node = new FragmentContent(document, {content: fragment, label: "first"})
  expect(node.querySelector("button")).toBe(raw)
  node.update({content: fragment, label: "next"})
  expect(node.querySelector("button")).toBe(raw)
  node.update({content: null, label: "clear"})
  expect(raw.parentNode).toBeNull()
  node.update({content: fragment, label: "empty"})
  expect(node.querySelector("button")).toBeNull()
  expect(fragment.childNodes).toHaveLength(0)
  node.dispose()
}))

test("generated locals не захватывают parameter, body bindings, custom hook arguments и default source references", () => withCompiled(({Hygienic, HookScope, HygienicDefault}) => {
  const document = createDocument(), host = document.createElement("div")
  document.append(host)
  const first = new Hygienic(document, {value: "first"})
  host.append(first)
  expect(first.textContent).toBe("first:safe")
  first.update({value: "next"})
  expect(first.textContent).toBe("next:safe")
  const hook = new HookScope(document, {value: "hook"})
  host.append(hook)
  expect(hook.textContent).toBe("hook1")
  const defaults = new HygienicDefault(document)
  host.append(defaults)
  expect(defaults.textContent).toBe("default")
  first.dispose(); hook.dispose(); defaults.dispose()
}))

test("custom hook с явным scope сохраняет свои state/memo без runtime dispatcher", () => withCompiled(({CustomCounter}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const counter = new CustomCounter(document, {initial: 3})
  host.append(counter)
  counter.dispatchEvent(new Event("click"))
  expect(counter.textContent).toBe("4:8")
  counter.props = {initial: 999}
  expect(counter.textContent).toBe("4:8")
  counter.dispose()
}))

test("два вызова custom hook у одного owner и разные owners не разделяют hoisted component fields", () => withCompiled(({TwoCustomCounters}) => {
  const document = createDocument(), host = document.createElement("div")
  document.append(host)
  const first = new TwoCustomCounters(document, {}), second = new TwoCustomCounters(document, {})
  host.append(first, second)
  const buttons = first.querySelectorAll("button")
  buttons[0]!.dispatchEvent(new Event("click"))
  expect([...first.querySelectorAll("button")].map(node => node.textContent)).toEqual(["2", "10"])
  expect([...second.querySelectorAll("button")].map(node => node.textContent)).toEqual(["1", "10"])
  buttons[1]!.dispatchEvent(new Event("click"))
  expect([...first.querySelectorAll("button")].map(node => node.textContent)).toEqual(["2", "11"])
  first.dispose(); second.dispose()
}))

test("zero-slot specialization сохраняет отклонение неизвестного DOM content до изменения дерева", () => withCompiled(({Hygienic}) => {
  const document = createDocument(), host = document.createElement("div"), raw = document.createElement("button")
  document.append(host)
  host.append(raw)
  const node = new Hygienic(document, {value: "first"})
  host.append(node)
  const accepted = node.props
  expect(() => node.update({value: "rejected"}, {unknown: raw})).toThrow("Unknown DOM content slot")
  expect(node.props).toBe(accepted)
  expect(node.textContent).toBe("first:safe")
  expect(raw.parentNode).toBe(host)
  node.dispose()
}))

test("component-return/fragment/root slot используют настоящий DOMGroup без host", () => withCompiled(({ComponentRoot, Rows, RootSlot}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const component = new ComponentRoot(document, {initial: 2})
  expect(component).toBeInstanceOf(DOMGroup)
  host.append(component)
  expect(host.children).toHaveLength(1)
  expect(host.children[0]!.localName).toBe("button")
  expect(host.textContent).toBe("2:4")
  component.dispose()
  component.remove()
  const rows = new Rows(document, {rows: [{id: "a", value: 1}, {id: "b", value: 2}]})
  host.append(rows)
  const first = host.children[0]!
  const second = host.children[1]!
  first.dispatchEvent(new Event("click"))
  rows.props = {rows: [{id: "b", value: 20}, {id: "a", value: 10}]}
  expect(host.children[0] === second && host.children[1] === first).toBeTrue()
  expect(host.textContent).toBe("2:42:4")
  expect(() => { rows.props = {rows: [{id: "a", value: 0}, {id: "a", value: 0}]} }).toThrow("Duplicate keyed component")
  expect(host.children[0] === second && host.children[1] === first).toBeTrue()
  rows.dispose()
  rows.remove()
  const raw = document.createElement("b")
  raw.textContent = "raw"
  const slot = new RootSlot(document, {}, {"": raw})
  host.append(slot)
  expect(host.children[0] === raw).toBeTrue()
  slot.dispose()
  slot.remove()
}))

test("named/default slots сохраняют вложенные prepared state и cleanup", () => withCompiled(({NamedSlots}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  let mounts = 0
  let cleanups = 0
  const props = {label: "Header", mount: () => { mounts++ }, cleanup: () => { cleanups++ }}
  const pane = new NamedSlots(document, props)
  host.append(pane)
  const header = host.querySelector("header button")!
  const body = host.querySelector("main button")!
  body.dispatchEvent(new Event("click"))
  pane.props = {...props, label: "Next"}
  expect(host.querySelector("header button") === header && host.querySelector("main button") === body).toBeTrue()
  expect(header.textContent).toBe("Next:0")
  expect(body.textContent).toBe("3:6")
  expect([mounts, cleanups]).toEqual([1, 0])
  pane.dispose()
  expect(cleanups).toBe(1)
}))

test("context и external store обновляются у того же standalone Element", () => withCompiled(({Theme, MemoConsumer, Store}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const consumer = new MemoConsumer(document, {}, undefined, {context: Theme, value: "first", parent: null})
  host.append(consumer)
  consumer.update({}, undefined, {context: Theme, value: "next", parent: null})
  expect(consumer.textContent).toBe("next")
  consumer.dispose()
  consumer.remove()
  let value = "first"
  const listeners = new Set<() => void>()
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
  const store = new Store(document, {subscribe, getSnapshot: () => value})
  host.append(store)
  expect(listeners.size).toBe(1)
  value = "next"
  for (const listener of listeners) listener()
  document.flushTasks()
  expect(store.textContent).toBe("next")
  store.remove()
  expect(listeners.size).toBe(0)
  host.append(store)
  expect(listeners.size).toBe(1)
  store.dispose()
  expect(listeners.size).toBe(0)
}))

test("native insertion rejection откатывает child props, actual raw origins, focus и lifecycle", () => withCompiled(({Atomic}) => {
  const document = createDocument()
  const host = document.createElement("div")
  const origin = document.createElement("aside")
  const body = document.createElement("body")
  document.append(body)
  body.append(host, origin)
  const accepted = new DisplayElement(document)
  const transferred = new DisplayElement(document)
  const invalid = document.createElement("button")
  origin.append(transferred, invalid)
  let mounts = 0
  let cleanups = 0
  const props = {label: "Accepted", mount: () => { mounts++ }, cleanup: () => { cleanups++ }}
  const content = {"": accepted}
  const instance = new Atomic(document, props, content)
  const acceptedProps = instance.props
  host.append(instance)
  const button = host.querySelector("button") as HTMLButtonElement
  button.dispatchEvent(new Event("click"))
  button.focus()
  expect(() => instance.update({...props, label: "Rejected"}, {"": [transferred, invalid]})).toThrow("Space accepts only spatial elements")
  expect(instance.props === acceptedProps && instance.content === content).toBeTrue()
  expect(button.textContent).toBe("Accepted:1")
  expect(button === host.querySelector("button") && document.activeElement === button).toBeTrue()
  expect(accepted.parentNode === host.querySelector("space")).toBeTrue()
  expect(transferred.parentNode === origin && invalid.parentNode === origin).toBeTrue()
  expect([mounts, cleanups]).toEqual([1, 0])
  instance.update({...props, label: "Next"}, content)
  expect(button.textContent).toBe("Next:1")
  button.dispatchEvent(new Event("click"))
  expect(button.textContent).toBe("Next:2")
  instance.dispose()
}))

test("external snapshot retry не публикует устаревший draft; failed update сохраняет accepted props", () => withCompiled(({Store}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  let reads = 0
  let subscriptions = 0
  const subscribe = () => { subscriptions++; return () => { subscriptions-- } }
  const props = {subscribe, getSnapshot: () => ++reads === 1 ? "stale" : "stable"}
  const instance = new Store(document, props)
  const acceptedProps = instance.props
  host.append(instance)
  expect(instance.textContent).toBe("stable")
  expect(subscriptions).toBe(1)
  let unstable = 0
  expect(() => instance.update({subscribe, getSnapshot: () => String(unstable++)})).toThrow("Unstable DOM component update")
  expect(instance.props === acceptedProps).toBeTrue()
  expect(instance.textContent).toBe("stable")
  expect(subscriptions).toBe(1)
  instance.dispose()
  expect(subscriptions).toBe(0)
}))

test("тот же generated Counter регистрируется customized builtin без CE adapter", () => withCompiled(({Counter}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  document.customElementRegistry.define("compiled-counter", Counter, {extends: "button"})
  const counter = document.createElement("button", {is: "compiled-counter"}) as HTMLButtonElement & {props: unknown, dispose(): void}
  expect(counter).toBeInstanceOf(Counter)
  expect(counter).toBeInstanceOf(HTMLButtonElement)
  expect(counter.childNodes).toHaveLength(0)
  let mounts = 0
  let cleanups = 0
  counter.props = {label: "CE", mount: () => { mounts++ }, cleanup: () => { cleanups++ }}
  host.append(counter)
  counter.dispatchEvent(new Event("click"))
  expect(counter.textContent).toBe("CE:1")
  expect([mounts, cleanups]).toEqual([1, 0])
  counter.remove()
  expect(cleanups).toBe(1)
  host.append(counter)
  expect(counter.textContent).toBe("CE:1")
  expect(mounts).toBe(2)
  counter.dispose()
  expect(cleanups).toBe(2)
}))

test("обычные JSX expressions компилируются в construction data без automatic runtime", () => withCompiled(({TopLevel, createInline, renderInto}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createDomRoot(host)
  try {
    root.render(TopLevel)
    expect(host.textContent).toBe("4:8")
    root.render(createInline("Inline"))
    expect(host.children).toHaveLength(2)
    expect(host.querySelector("span")!.textContent).toBe("Inline")
    expect(host.querySelector("span")!.getAttribute("title")).toBe("Inline")
    renderInto(root, 7)
    expect(host.textContent).toBe("7:14")
  } finally { root.unmount() }
}))

test("standalone props spread вычисляется один раз по порядку, override и key сохраняют DOM identity", () => withCompiled(({spreadValue, spreadRoot}) => {
  const events: string[] = []
  const first = () => { events.push("spread:first"); return {get label() { events.push("first:label"); return "first" }, get key() { events.push("first:key"); return "first" }} }
  const last = () => { events.push("spread:last"); return {get content() { events.push("last:content"); return "last" }, get key() { events.push("last:key"); return "last" }} }
  const value = spreadValue(events, first, last, "final")
  expect(events).toEqual(["content", "spread:first", "first:label", "first:key", "key", "spread:last", "last:content", "last:key", "label"])
  expect(value.key).toBe("last")
  expect(value.props).toEqual({content: "last", label: "final"})
  expect("key" in value.props).toBeFalse()
  const document = createDocument(), host = document.createElement("div")
  document.append(host)
  const root = spreadRoot(host, {label: "initial", key: "last"})
  try {
    const node = host.firstElementChild!
    node.dispatchEvent(new Event("click"))
    root.render(value)
    expect(host.firstElementChild).toBe(node)
    expect(node.textContent).toBe("final:last:1")
    root.render(spreadValue([], () => ({}), () => ({key: "replacement"}), "new"))
    expect(host.firstElementChild).not.toBe(node)
    expect(host.textContent).toBe("new:first:0")
  } finally { root.unmount() }
}))

test("standalone spread сохраняет nested default/named slots и не обходит reserved authoring fields", () => withCompiled(({spreadPane, spreadReserved, spreadAssigned}) => {
  const events: string[] = []
  const value = spreadPane(events, () => { events.push("spread"); return {get id() { events.push("id"); return "pane" }} })
  expect(events).toEqual(["spread", "id", "header", "body"])
  const document = createDocument(), host = document.createElement("div")
  document.append(host)
  const root = createDomRoot(host)
  try {
    root.render(value)
    expect(host.querySelector("section")!.getAttribute("data-id")).toBe("pane")
    expect(host.querySelector("header")!.textContent).toBe("header::0")
    expect(host.querySelector("main")!.textContent).toBe("body::0")
    expect(() => spreadReserved({children: null})).toThrow("between component tags")
    expect(() => spreadReserved({slot: "header"})).toThrow("static authored assignment")
    expect(() => spreadReserved({className: "override"})).toThrow("class-based component styling")
    expect(() => spreadReserved({key: {}})).toThrow("key must be a string or number")
    expect(() => spreadAssigned({slot: "other"})).toThrow("override a static slot assignment")
    root.render(spreadAssigned({slot: "header"}))
    expect(host.querySelector("header")!.textContent).toBe("header::0")
  } finally { root.unmount() }
}))

test("native passthrough normalizations читают одно DOM state, explicit inputs остаются командами", () => withCompiled(({NativeInputs}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const node = new NativeInputs(document, {label: "first", disabled: false, tabIndex: 0})
  host.append(node)
  node.disabled = true
  node.tabIndex = 7
  expect(node.props.disabled).toBeTrue()
  expect(node.props.tabIndex).toBe(7)
  node.dispatchEvent(new Event("click"))
  expect(node.disabled).toBeTrue()
  expect(node.tabIndex).toBe(7)
  expect(node.textContent).toBe("first:1:true:7")
  node.props = {...node.props, label: "next"}
  expect(node.disabled).toBeTrue()
  expect(node.tabIndex).toBe(7)
  node.props = {label: "explicit", disabled: false, tabIndex: 2}
  expect(node.disabled).toBeFalse()
  expect(node.tabIndex).toBe(2)
  node.dispose()
  const optional = new NativeInputs(document, {label: "optional"})
  host.append(optional)
  expect(optional.props.disabled).toBeUndefined()
  expect(optional.props.tabIndex).toBeUndefined()
  expect(optional.disabled).toBeFalse()
  expect(optional.tabIndex).toBe(0)
  expect("disabled" in optional.props).toBeFalse()
  expect(Object.keys(optional.props)).toEqual(["label"])
  optional.tabIndex = 9
  optional.dispatchEvent(new Event("click"))
  expect(optional.props.tabIndex).toBe(9)
  expect(optional.textContent).toBe("optional:1:undefined:9")
  optional.props = {label: "unrelated"}
  expect(optional.tabIndex).toBe(9)
  expect(optional.props.tabIndex).toBe(9)
  optional.dispatchEvent(new Event("click"))
  expect(optional.textContent).toBe("unrelated:2:undefined:9")
  optional.dispose()
}))

test("memo хранит comparison history, новый принятый input доступен следующему state render", () => withCompiled(({MemoWholeProps}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const previous: object[] = []
  const next: object[] = []
  const first = {label: "first", read: (value: object) => { previous.push(value) }}
  const second = {label: "first", read: (value: object) => { next.push(value) }}
  const node = new MemoWholeProps(document, first)
  host.append(node)
  node.props = second
  expect(node.props.read).toBe(second.read)
  expect(previous).toHaveLength(1)
  expect(next).toHaveLength(0)
  node.dispatchEvent(new Event("click"))
  expect(node.textContent).toBe("first:1")
  expect(previous).toHaveLength(1)
  expect(next).toHaveLength(1)
  node.dispose()
}))

test("все child refs доступны parent layout в одном DOM commit", () => withCompiled(({RefParent}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  let read: unknown
  const node = new RefParent(document, {read: (element: unknown) => { read = element }})
  host.append(node)
  expect(read === host.querySelector("span")).toBeTrue()
  node.dispose()
}))

test("[props] видит external input revision и сохраняет identity при hook-only update", () => withCompiled(({WholeProps}) => {
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const revisions: unknown[] = []
  const props = {label: "first", read: (value: unknown) => { revisions.push(value) }}
  const node = new WholeProps(document, props)
  host.append(node)
  const first = node.props
  node.dispatchEvent(new Event("click"))
  expect(node.props === first).toBeTrue()
  expect(revisions).toHaveLength(1)
  node.props = {...props, label: "next"}
  expect(node.props === first).toBeFalse()
  expect(revisions).toHaveLength(2)
  expect(node.textContent).toBe("next:1")
  node.dispose()
}))

test("непринятый child draft возвращает raw slot origins, даже если apply ещё не начался", () => withCompiled(({RawAtomic}) => {
  const document = createDocument()
  const origin = document.createElement("div")
  const raw = document.createElement("button")
  document.append(origin)
  origin.append(raw)
  let events = 0
  raw.addEventListener("click", () => { events++ })
  expect(() => new RawAtomic(document, {invalid: true}, {"": raw})).toThrow("requires a primitive value")
  expect(raw.parentNode === origin).toBeTrue()
  expect(raw.isConnected).toBeTrue()
  raw.dispatchEvent(new Event("click"))
  expect(events).toBe(1)
}))

test("single factory root — exact authored Element, native prototype и generated constructor identity", () => withCompiled(({FactoryCounter, MemoFactoryCounter}) => {
  let created = 0
  let supplied: unknown
  class FactoryElement extends HTMLElement {
    readonly factory = true
    constructor(document: Document) { super(document, "section") }
  }
  const document = createDocument({elementFactories: {section: owner => { created++; supplied = new FactoryElement(owner); return supplied as FactoryElement }}})
  const host = document.createElement("div")
  document.append(host)
  const node = new MemoFactoryCounter(document, {label: "factory"})
  expect(node === supplied).toBeTrue()
  expect(node).toBeInstanceOf(FactoryElement)
  expect(node).toBeInstanceOf(FactoryCounter)
  expect(node).toBeInstanceOf(MemoFactoryCounter)
  expect(node).not.toBeInstanceOf(DOMGroup)
  expect(node.constructor).toBe(FactoryElement)
  expect(created).toBe(1)
  host.append(node)
  node.dispatchEvent(new Event("click"))
  expect(node.textContent).toBe("factory:1")
  node.props = {label: "next"}
  expect(host.firstElementChild === node).toBeTrue()
  expect(node.textContent).toBe("next:1")
  expect(created).toBe(1)
  node.dispose()
}))
