import socketKey from "@zavx0z/immersive-nodes-model-socket-key"
import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@zavx0z/immersive-component"
import {createDocument, InputEvent, MouseEvent, type Element, type HTMLInputElement} from "@zavx0z/immersive-dom"
import {Parameter as ParameterModel, type ParameterSnapshot} from "@zavx0z/immersive-nodes-tree"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {ParameterEndpoint} from "./parameter-endpoint"
import type {ImmersiveNodesProjectionParameter} from "@zavx0z/immersive-nodes-projection-parameter"
type ParameterInput = Parameters<NonNullable<ImmersiveNodesProjectionParameter.Input["onInput"]>>[0]
type ParameterProps = ImmersiveNodesProjectionParameter.Input
import {PARAMETER_EXAMPLES, parameterFixture, type ParameterMechanism} from "./parameter.fixture.ts"

const root = resolve(import.meta.dir, "../../../..")
Bun.plugin(createJsxBunPlugin({
  cwd: root,
  persistent: true,
  sourceRoots: [resolve(root, "nodes/projection/parameter"), resolve(root, "nodes/parameter"), resolve(root, "nodes/socket"), resolve(root, "ui")],
}))

const {default: Parameter} = await import("@zavx0z/immersive-nodes-projection-parameter")
const {default: resolveProjectedParameterPresentation} = await import("@zavx0z/immersive-nodes-projection-parameter-presentation")
const authored = await import("./authored.fixture")
const components = {
  "text": authored.AuthoredText,
  "number": authored.AuthoredNumber,
  "slider": authored.AuthoredSlider,
  "checkbox": authored.AuthoredCheckbox,
  "switch": authored.AuthoredSwitch,
  "select": authored.AuthoredSelect,
  "cycle": authored.AuthoredCycle,
  "option-group": authored.AuthoredOptionGroup,
  "color": authored.AuthoredColor,
  "vector": authored.AuthoredVector,
  "matrix": authored.AuthoredMatrix,
  "path": authored.AuthoredPath,
  "reference": authored.AuthoredReference,
  "collection": authored.AuthoredCollection,
  "output": authored.AuthoredOutput,
}

test("[PARAMETERS-PROJECTION-001] все виды из модели используют ту же структуру и CSS, что готовые параметры", () => {
  for (const kind of Object.keys(PARAMETER_EXAMPLES) as ParameterMechanism[]) {
    for (const variant of ["field", "both", "connected", "disabled", "readonly", "hidden-label"]) {
      const snapshot = parameterFixture(kind, variant).snapshot()
      const labelHidden = variant === "hidden-label"
      const connected = variant === "connected"
      const sockets: readonly ParameterEndpoint[] = variant === "field" ? [] : [
        {id: "in", kind: "custom", direction: "input", side: "left", label: "in", connected},
        {id: "out", kind: "custom", direction: "output", side: "right", label: "out", connected},
      ]
      const projectedSnapshot = {
        ...snapshot,
        presentation: {
          ...PARAMETER_EXAMPLES[kind].presentation,
          label: PARAMETER_EXAMPLES[kind].label,
          disabled: variant === "disabled",
          readOnly: variant === "readonly",
          labelHidden,
          description: "Описание",
        },
      }
      const p = resolveProjectedParameterPresentation(projectedSnapshot)
      const direct = mount(components[kind], {
        id: snapshot.id,
        nodeId: "node",
        label: p.label,
        labelHidden,
        sockets,
        connected,
        disabled: p.disabled,
        readOnly: p.readOnly,
        title: p.title,
        spacingBefore: "medium",
        ...fieldProps(kind, snapshot, p),
      })
      const projected = mount(Parameter, {
        nodeId: "node",
        snapshot: projectedSnapshot,
        sockets: sockets.map(socket => ({id: socket.id, direction: socket.direction, side: socket.side})),
        connectedSocketKeys: connected ? new Set([socketKey("node", "in"), socketKey("node", "out")]) : undefined,
        spacingBefore: "medium",
      })
      try {
        expect(semantic(parameter(projected.element)), `${kind}/${variant}`).toEqual(semantic(parameter(direct.element)))
        expect(styles(projected), `${kind}/${variant}: CSS owners`).toEqual(styles(direct))
        expect(parameter(projected.element).querySelector("[data-parameter-field]")?.hasAttribute("hidden"),
          `${kind}/${variant}: поле доступно вместе с сокетами`).toBe(false)
        const row = parameter(projected.element)
        const field = row.querySelector("[data-parameter-field]")!
        expect(row.querySelector("[data-parameter-label]"), `${kind}/${variant}: Layout не дублирует подпись`).toBeNull()
        expect(field.textContent.includes(p.label), `${kind}/${variant}: подпись принадлежит Field`).toBe(!labelHidden)
      } finally {
        direct.dispose()
        projected.dispose()
      }
    }
  }
})

test("[PARAMETERS-PROJECTION-002] обновления Store, ввод и подключение сохраняют готовое поле и очищают подписку", async () => {
  const model = new ParameterModel<string, {label: string}>("value", "Первое", {label: "Текст"})
  let snapshot = model.snapshot()
  let subscriptions = 0
  const store = {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      subscriptions += 1
      const unsubscribe = model.subscribe(() => {
        snapshot = model.snapshot()
        listener()
      })
      return () => {
        subscriptions -= 1
        unsubscribe()
      }
    },
  }
  const changes: ParameterInput[] = []
  const events: unknown[] = []
  const sockets: string[] = []
  const update = (change: ParameterInput, event: Event) => {
    changes.push(change)
    events.push(event)
    model.set(change.value as string)
  }
  const props: ParameterProps = {
    nodeId: "node",
    snapshot,
    store,
    sockets: [{id: "in", direction: "input", parameterId: "value"}],
    onInput: update,
    onChange: update,
    onSocketActivate: id => sockets.push(id),
  }
  const mounted = mount(Parameter, props)
  const row = parameter(mounted.element)
  const input = row.querySelector("input") as HTMLInputElement
  const socket = row.querySelector('[data-socket-id="in"]')!
  try {
    expect(subscriptions).toBe(1)
    model.set("Внешнее обновление")
    await settle()
    expect(input.value).toBe("Внешнее обновление")
    expect(changes).toEqual([])

    input.value = "Ввод"
    const event = new InputEvent("input", {bubbles: true, data: "Ввод", inputType: "insertText"})
    input.dispatchEvent(event)
    await settle()
    expect(changes).toEqual([{nodeId: "node", parameterId: "value", value: "Ввод"}])
    expect(events).toEqual([event])
    expect(model.value).toBe("Ввод")
    expect(parameter(mounted.element)).toBe(row)
    expect(row.querySelector("input")).toBe(input)

    mounted.render({...props, connectedSocketKeys: new Set([socketKey("node", "in")])})
    expect(row.querySelector("[data-parameter-field]")?.hasAttribute("hidden")).toBe(false)
    expect(row.querySelector("input")).toBe(input)
    expect(input.disabled).toBe(false)
    expect(input.readOnly).toBe(false)
    expect(socket.getAttribute("aria-pressed")).toBe("true")
    input.value = "Ввод при подключении"
    const connectedEvent = new InputEvent("input", {bubbles: true, data: "Ввод при подключении", inputType: "insertText"})
    input.dispatchEvent(connectedEvent)
    await settle()
    expect(changes.at(-1)).toEqual({nodeId: "node", parameterId: "value", value: "Ввод при подключении"})
    expect(events.at(-1)).toBe(connectedEvent)
    expect(model.value).toBe("Ввод при подключении")
    expect(row.querySelector("input")).toBe(input)
    expect(row.querySelector('[data-socket-id="in"]')).toBe(socket)
    socket.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    expect(sockets).toEqual(["in"])
    mounted.render(props)
    expect(row.querySelector("[data-parameter-field]")?.hasAttribute("hidden")).toBe(false)
    expect(row.querySelector('[data-socket-id="in"]')).toBe(socket)
    socket.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    expect(sockets).toEqual(["in", "in"])
  } finally {
    mounted.dispose()
  }
  expect(subscriptions).toBe(0)
  model.set("После удаления")
  await settle()
  expect(mounted.element.childNodes).toHaveLength(0)
})

test("[PARAMETERS-PROJECTION-003] готовые параметры принимают несколько точных сокетов одной стороны и скрытую подпись", () => {
  const activations: string[] = []
  const model = new ParameterModel("value", 2, {label: "", labelHidden: true})
  const mounted = mount(Parameter, {
    nodeId: "node",
    snapshot: model.snapshot(),
    sockets: [
      {id: "first", direction: "input", parameterId: "value"},
      {id: "second", direction: "input", parameterId: "value"},
    ],
    resolvedSocketSides: new Map([[socketKey("node", "first"), "right"], [socketKey("node", "second"), "right"]]),
    onSocketActivate: (id: string) => activations.push(id),
  })
  try {
    const row = parameter(mounted.element)
    expect(row.querySelector('[data-parameter-sockets="left"]')?.querySelectorAll("[data-socket-id]")).toHaveLength(0)
    const endpoints = row.querySelector('[data-parameter-sockets="right"]')!.querySelectorAll("[data-socket-id]")
    expect([...endpoints].map(socket => socket.getAttribute("data-socket-id"))).toEqual(["first", "second"])
    for (const socket of endpoints) socket.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    expect(activations).toEqual(["first", "second"])
    expect(row.getAttribute("data-label-hidden")).toBe("true")
    expect(row.querySelector("[data-parameter-label]")).toBeNull()
    expect(row.querySelector("input")).not.toBeNull()
  } finally {
    mounted.dispose()
  }
  expect(() => mount(Parameter, {
    snapshot: model.snapshot(), nodeId: "node",
    sockets: [
      {id: "same", direction: "input", side: "left", kind: "custom", label: "A"},
      {id: "same", direction: "output", side: "right", kind: "custom", label: "B"},
    ],
  })).toThrow("Socket id must be unique")
})

function fieldProps(kind: ParameterMechanism, snapshot: ParameterSnapshot, p: ReturnType<typeof resolveProjectedParameterPresentation>) {
  switch (kind) {
    case "checkbox": case "switch": return {checked: p.booleanValue}
    case "number": return {value: p.numberValue, min: p.min, max: p.max, step: p.step, precision: p.precision}
    case "slider": return {value: p.numberValue, min: p.min, max: p.max, step: p.step}
    case "text": case "path": return {value: p.stringValue, placeholder: p.placeholder}
    case "cycle": case "option-group": return {value: p.stringValue, options: p.options ?? []}
    case "select": return {value: p.stringValue, options: p.options}
    case "vector": return {value: p.vector, axes: p.axes, min: p.min, max: p.max, step: p.rawStep}
    case "matrix": return {value: p.matrix, step: p.rawStep}
    case "color": return {value: p.color}
    case "reference": return {value: p.reference ?? null}
    case "collection": return {items: p.collection?.items ?? [], selectedId: p.collection?.selectedId ?? null, visibleRows: p.collection?.visibleRows}
    case "output": return {value: snapshot.value}
  }
}

function mount(component: unknown, props: Readonly<Record<string, unknown>>) {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  const root = createRoot(element)
  const render = (next: Readonly<Record<string, unknown>>) => root.render(component as CompiledTemplate<typeof next>, next)
  try {
    render(props)
  } catch (error) {
    root.unmount()
    throw error
  }
  return {
    root,
    element,
    render,
    dispose() {
      root.unmount()
      expect(element.childNodes).toHaveLength(0)
    },
  }
}

function parameter(element: Element) {
  const result = element.querySelector("[data-parameter-id]")
  if (result === null) throw new Error("Parameter did not mount")
  return result
}

function styles(mounted: ReturnType<typeof mount>) {
  return mounted.root.readStyleSheets().styleSheets.map(sheet => ({id: sheet.id, cssText: sheet.cssText}))
    .sort((left, right) => left.id.localeCompare(right.id))
}

function semantic(element: Element): unknown {
  const attributes = element.getAttributeNames().filter(name =>
    !["id", "for", "aria-controls", "aria-labelledby"].includes(name),
  ).sort().map(name => [name, element.getAttribute(name)])
  return {
    tag: element.localName,
    attributes,
    text: element.textContent,
    children: [...element.children].map(semantic),
  }
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}
