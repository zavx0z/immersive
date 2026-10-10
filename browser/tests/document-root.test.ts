import {expect, test} from "bun:test"
import type {TrueTypeFont} from "@zavx0z/immersive-engine"
import {createDocumentRootWithSeams, inspectDocumentRoot} from "../document/index.ts"
import {createFakeRuntime, createFakeRuntimeState, presentFakeFrame} from "./experience.fixture.ts"

test("императивный DOM использует один runtime, ввод, проекции и очистку без ComponentRoot", async () => {
  const state = createFakeRuntimeState()
  const errors: Error[] = []
  const canvas = {
    getContext: () => null,
    getBoundingClientRect: () => ({width: 800, height: 600, left: 0, top: 0}),
  } as unknown as HTMLCanvasElement
  const root = createDocumentRootWithSeams(canvas, {onUncaughtError: error => errors.push(error)}, {
    loadFont: async () => ({} as TrueTypeFont),
    createRuntime: async options => {
      state.factoryCalls++
      return createFakeRuntime(options, state)
    },
    createStyleSheets: () => ({refresh() {}, async whenReady() {}, dispose() {}}),
  })
  try {
    const document = root.document
    const space = document.createElement("space")
    const viewpoint = document.createElement("viewpoint")
    const hud = document.createElement("hud")
    const button = document.createElement("button")
    button.textContent = "Первый"
    hud.append(button)
    space.append(viewpoint, hud)
    document.querySelector("body")!.append(space)
    root.render()
    const presentation = await inspectDocumentRoot(root).whenReady()
    expect(presentation.document).toBe(document)
    expect(presentation.space).toBe(space)
    expect(presentation.viewPoint).toBe(viewpoint)
    expect(state.factoryCalls).toBe(1)
    button.textContent = "Второй"
    root.render()
    await inspectDocumentRoot(root).whenReady()
    expect(document.querySelector("button")).toBe(button)
    expect(button.textContent).toBe("Второй")
    expect(state.factoryCalls).toBe(1)
    presentation.input.pointerMove({x: 10, y: 20})
    expect(state.projectionInputs.at(-1)?.type).toBe("pointermove")
    expect(errors).toEqual([])
  } finally {
    root.unmount()
  }
  expect(state.disposed).toBe(true)
  expect(root.document.querySelector("body")?.childNodes).toHaveLength(0)
  expect(() => root.render()).toThrow("unmounted")
})

test("поставка императивного подключения не содержит JSX, Template или Component", async () => {
  const build = await Bun.build({
    entrypoints: [`${import.meta.dir}/../document/index.ts`],
    target: "browser",
    format: "esm",
    loader: {".wgsl": "text"},
    metafile: true,
  })
  expect(build.success, build.logs.map(String).join("\n")).toBe(true)
  const forbidden = Object.keys(build.metafile!.inputs).filter(path =>
    /(?:^|\/)(?:component|template|jsx)\//u.test(path),
  )
  expect(forbidden, "DOM-подключение не импортирует компонентный runtime и инструменты авторства").toEqual([])
})


test("готовый custom component использует один Document, runtime и frame hooks через пространственные hosts", async () => {
  const {HTMLElement, Event} = await import("@zavx0z/immersive-dom")
  const {componentElement, useEffect, useState} = await import("@zavx0z/immersive-component")
  const {bindText, bindEvent, defineCompiledTemplate, writeBinding} = await import("@zavx0z/immersive-template/compiled")
  const {useFrame, useSpace} = await import("../src/root-context.ts")
  const state = createFakeRuntimeState()
  const errors: Error[] = []
  const canvas = {
    getContext: () => null,
    getBoundingClientRect: () => ({width: 800, height: 600, left: 0, top: 0}),
  } as unknown as HTMLCanvasElement
  const root = createDocumentRootWithSeams(canvas, {onUncaughtError: error => errors.push(error)}, {
    loadFont: async () => ({} as TrueTypeFont),
    createRuntime: async options => {
      state.factoryCalls++
      return createFakeRuntime(options, state)
    },
    createStyleSheets: () => ({refresh() {}, async whenReady() {}, dispose() {}}),
  })
  let effects = 0, cleanups = 0, frames = 0, renders = 0
  const App = defineCompiledTemplate({
    bindingCount: 2,
    mount(document) {
      const space = document.createElement("space")
      const scene = document.createElement("scene-fragment")
      const camera = document.createElement("scene-fragment")
      camera.append(document.createElement("viewpoint"))
      const first = document.createElement("xr-group")
      const second = document.createElement("xr-group")
      first.setAttribute("name", "first")
      second.setAttribute("name", "second")
      const meshHost = document.createElement("scene-fragment")
      meshHost.id = "mesh-host"
      const mesh = document.createElement("xr-mesh")
      mesh.setAttribute("name", "cube")
      const resources = document.createElement("scene-fragment")
      resources.id = "resources"
      resources.append(document.createElement("xr-geometry"), document.createElement("xr-material"))
      mesh.append(resources)
      meshHost.append(mesh)
      first.append(meshHost)
      const displayHost = document.createElement("scene-fragment")
      displayHost.id = "display-host"
      const display = document.createElement("display")
      display.setAttribute("width", "254")
      display.setAttribute("height", "254")
      display.setAttribute("style", "width: 960px; height: 960px")
      const button = document.createElement("button")
      const text = document.createTextNode("")
      button.append(text)
      display.append(button)
      displayHost.append(display)
      scene.append(camera, first, second, displayHost)
      space.append(scene)
      return {nodes: [space], bindings: [bindText(text), bindEvent(button, "click")]}
    },
    render(_props, values) {
      renders++
      const [count, setCount] = useState(0)
      const width = useSpace(value => value.size.width)
      useFrame(() => { frames++ })
      useEffect(() => { effects++; return () => { cleanups++ } }, [])
      writeBinding(values, 0, `${width}:${count}`)
      writeBinding(values, 1, () => setCount(count + 1))
    },
  })
  try {
    const document = root.document
    document.customElementRegistry.define("scene-fragment", class extends HTMLElement {})
    document.customElementRegistry.define("ready-scene", componentElement(App))
    const app = document.createElement("ready-scene")
    document.querySelector("body")!.append(app)
    root.render()
    const presentation = await root.whenReady()
    expect(presentation.document).toBe(document)
    expect(state.factoryCalls).toBe(1)
    expect(state.planes.size).toBe(1)
    expect(frames).toBeGreaterThan(0)
    const frameListeners = state.beforeRender.size
    const space = document.querySelector("space")!
    const first = document.querySelector('xr-group[name="first"]')!
    const second = document.querySelector('xr-group[name="second"]')!
    const meshHost = document.getElementById("mesh-host")!
    const resources = document.getElementById("resources")!
    const firstObject = state.space!.children.find(object => object.name === "first")!
    const secondObject = state.space!.children.find(object => object.name === "second")!
    const heldMesh = firstObject.children[0]!
    second.append(meshHost)
    expect(firstObject.children).toHaveLength(0)
    expect(secondObject.children).toEqual([heldMesh])
    expect(meshHost.parentNode).toBe(second)
    expect(first.isConnected).toBe(true)
    resources.replaceChildren(document.createElement("xr-geometry"), document.createElement("xr-material"))
    expect(secondObject.children[0]).toBe(heldMesh)
    const display = document.querySelector("display")!
    const plane = state.planes.get(display)
    const host = document.createElement("scene-fragment")
    space.append(host)
    host.append(document.getElementById("display-host")!)
    expect(state.planes.get(display)).toBe(plane)
    const button = app.querySelector("button")! as InstanceType<typeof HTMLElement>
    button.focus()
    expect(state.nativeOwner).toBe(display)
    let bubbled = 0
    app.addEventListener("click", () => { bubbled++ })
    button.dispatchEvent(new Event("click", {bubbles: true}))
    expect(button.textContent).toBe("800:1")
    expect(bubbled).toBe(1)
    const destination = document.createElement("scene-fragment")
    document.querySelector("body")!.append(destination)
    const beforeMove = renders
    destination.append(app)
    expect(app.querySelector("button")).toBe(button)
    expect(document.activeElement).toBe(button)
    expect(renders).toBe(beforeMove)
    expect(effects).toBe(1)
    expect(cleanups).toBe(0)
    expect(state.beforeRender.size).toBe(frameListeners)
    expect(state.factoryCalls).toBe(1)
    const beforeFrame = frames
    state.requestedFrame?.()
    expect(frames).toBe(beforeFrame + 1)
    expect(errors).toEqual([])
  } finally { root.unmount() }
  expect(cleanups).toBe(1)
  const afterUnmount = frames
  presentFakeFrame(state)
  expect(frames).toBe(afterUnmount)
  expect(state.beforeRender.size).toBe(0)
  expect(state.disposed).toBe(true)
})
