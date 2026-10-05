import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {Raycaster, Space, TrueTypeFont, ViewPoint} from "@zavx0z/immersive-engine"
import {createDocumentInteractionController, createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {RendererWebGpuBackend, RendererWebGpuScreenOverlay, type Renderer} from "@zavx0z/immersive-webgpu"
import {createDocumentCanvasRuntimeWithSeams, type DocumentCanvasRuntimeSeams} from "../src/runtime.ts"
import {createDocumentSpaceRuntimeWithSeams, type DocumentSpaceRuntimeSeams} from "../src/space-runtime.ts"
import {createDocumentPlaneRuntime} from "../src/plane-runtime.ts"
import {createDocumentOverlayRuntime} from "../src/overlay-runtime.ts"
import type {DocumentNativeInputHost} from "../src/native-input-host.ts"

function fixture() {
  const document = createDocument()
  const root = document.createElement("main")
  document.append(root)
  const canvas = {width: 200, height: 200, style: {}, getBoundingClientRect: () => ({left: 0, top: 0, width: 200, height: 200}), addEventListener() {}, removeEventListener() {}} as unknown as HTMLCanvasElement
  const font = {} as TrueTypeFont
  let initialized = 0
  let disposed = 0
  const engine = {dispose() {disposed++}, setPixelRatio() {}, setSize() {}, renderComposition() {}, invalidateGeometry() {}} as unknown as Renderer
  const common = {
    createEngineRenderer: () => engine,
    initializeEngineRenderer: async () => {initialized++},
    createSpace: () => new Space(),
    createNativeInputHost: () => ({setActiveRoot() {}, synchronize() {}, dispose() {}}) as unknown as DocumentNativeInputHost,
    createResizeObserver: () => ({observe() {}, disconnect() {}}),
    readCanvasRect: () => ({left: 0, top: 0, width: 200, height: 200}),
    devicePixelRatio: () => 1,
    requestFrame: () => 1,
    cancelFrame() {}, setTimer: () => 1, clearTimer() {}, now: () => 0,
  }
  const canvasSeams: DocumentCanvasRuntimeSeams = {
    ...common,
    createFixedViewPoint: () => new ViewPoint({position: {x: 0, y: -100, z: 0}}),
    createBackend: options => new RendererWebGpuBackend(options),
    createOverlay: options => new RendererWebGpuScreenOverlay(options),
    createDocumentRenderer,
    createInteraction: createDocumentInteractionController,
  }
  const spaceSeams: DocumentSpaceRuntimeSeams = {
    ...common,
    createViewPoint: () => new ViewPoint({position: {x: 0, y: -100, z: 0}}), createWorldViewPoint: () => new ViewPoint({position: {x: 0, y: -100, z: 0}}), createRaycaster: () => new Raycaster(),
    createPlaneRuntime: createDocumentPlaneRuntime, createOverlayRuntime: createDocumentOverlayRuntime,
  }
  return {document, root, canvas, font, canvasSeams, spaceSeams, initialized: () => initialized, disposed: () => disposed}
}

test("Space startup NativeInputHost failure освобождает инициализированный Renderer и Canvas claim", async () => {
  const f = fixture()
  const create = () => createDocumentSpaceRuntimeWithSeams({canvas: f.canvas, document: f.document, font: f.font, styleSheets: []}, {
    ...f.spaceSeams, createNativeInputHost() {throw new Error("native host failed")},
  })
  await expect(create()).rejects.toThrow("native host failed")
  expect(f.initialized()).toBe(1)
  expect(f.disposed()).toBe(1)
  // Второй startup на том же Canvas доходит до своего failure, а не blocked claim.
  await expect(create()).rejects.toThrow("native host failed")
  expect(f.initialized()).toBe(2)
  expect(f.disposed()).toBe(2)
})

test("Canvas startup без backend textMeasurer освобождает Renderer и допускает повторный startup", async () => {
  const f = fixture()
  const create = () => createDocumentCanvasRuntimeWithSeams({canvas: f.canvas, document: f.document, root: f.root, font: f.font, styleSheets: []}, {
    ...f.canvasSeams, createBackend: () => ({textMeasurer: undefined}) as unknown as RendererWebGpuBackend,
  })
  await expect(create()).rejects.toThrow("font has no text measurer")
  expect(f.initialized()).toBe(1)
  expect(f.disposed()).toBe(1)
  await expect(create()).rejects.toThrow("font has no text measurer")
  expect(f.initialized()).toBe(2)
  expect(f.disposed()).toBe(2)
})
