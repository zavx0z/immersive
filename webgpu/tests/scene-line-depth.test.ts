import {expect, test} from "bun:test"
import {BufferAttribute, BufferGeometry, LineBasicMaterial, LineGlowMaterial, LineSegments} from "@zavx0z/immersive-engine"
import {Renderer} from "../src/renderer/index.ts"
import type {RenderItem} from "../src/renderer/utils/render-list.ts"
import type {RenderCommandEncoder} from "../src/renderer/render-bundle-cache.ts"

test("запасной цвет линии переживает повторную синхронизацию и освобождается с геометрией", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "GPUBufferUsage")
  Object.defineProperty(globalThis, "GPUBufferUsage", {configurable: true, value: {VERTEX: 1, COPY_DST: 2}})
  const renderer = new Renderer()
  const allocated: {size: number, destroys: number, destroy(): void}[] = []
  type Buffers = {positionBuffer: GPUBuffer, colorBuffer?: GPUBuffer, defaultLineColorBuffer?: GPUBuffer}
  const state = renderer as unknown as {
    device: GPUDevice
    getOrCreateGeometryBuffers(geometry: BufferGeometry): Buffers
    getOrCreateDefaultLineColorBuffer(geometry: BufferGeometry, buffers: Buffers): GPUBuffer
  }
  state.device = {
    createBuffer({size}: GPUBufferDescriptor) {
      const buffer = {size, destroys: 0, destroy() { this.destroys++ }}
      allocated.push(buffer)
      return buffer
    },
    queue: {writeBuffer() {}},
  } as unknown as GPUDevice
  const geometry = new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(6), 3))
  try {
    const first = state.getOrCreateDefaultLineColorBuffer(geometry, state.getOrCreateGeometryBuffers(geometry))
    for (let draw = 0; draw < 4; draw++) {
      const buffers = state.getOrCreateGeometryBuffers(geometry)
      expect(buffers.colorBuffer).toBeUndefined()
      expect(state.getOrCreateDefaultLineColorBuffer(geometry, buffers)).toBe(first)
    }
    expect(allocated).toHaveLength(2)
    expect(allocated.every(buffer => buffer.destroys === 0)).toBe(true)
    renderer.invalidateGeometry(geometry)
    expect(allocated.every(buffer => buffer.destroys === 1)).toBe(true)
  } finally {
    renderer.dispose()
    if (previous) Object.defineProperty(globalThis, "GPUBufferUsage", previous)
    else Reflect.deleteProperty(globalThis, "GPUBufferUsage")
  }
})

test("scene phases выбирают отдельные pipelines; обычные и UI draw сохраняют выбранный material path", () => {
  const renderer = new Renderer()
  const state = renderer as unknown as {
    linePipeline: GPURenderPipeline
    lineSceneDepthPipeline: GPURenderPipeline
    lineSceneColorPipeline: GPURenderPipeline
    lineOverlayPipeline: GPURenderPipeline
    lineSilhouettePipeline: GPURenderPipeline
    renderLines(): void
    renderObjectList(encoder: RenderCommandEncoder, items: RenderItem[], indices: ReadonlyMap<RenderItem, number>, ui?: boolean, sceneLinePhase?: "depth" | "color"): void
  }
  const legacy = {} as GPURenderPipeline, depth = {} as GPURenderPipeline, color = {} as GPURenderPipeline
  const overlay = {} as GPURenderPipeline, silhouette = {} as GPURenderPipeline
  state.linePipeline = legacy
  state.lineSceneDepthPipeline = depth
  state.lineSceneColorPipeline = color
  state.lineOverlayPipeline = overlay
  state.lineSilhouettePipeline = silhouette
  const pipelines: GPURenderPipeline[] = []
  let draws = 0
  state.renderLines = () => { draws++ }
  const encoder = {setPipeline(pipeline: GPURenderPipeline) { pipelines.push(pipeline) }} as RenderCommandEncoder
  const line = (material: LineBasicMaterial): RenderItem => {
    const object = new LineSegments(new BufferGeometry(), material)
    return {type: "line", object, worldMatrix: object.matrixWorld}
  }
  const scene = line(new LineGlowMaterial({visibilityMode: "scene"}))
  const basic = line(new LineBasicMaterial())
  const overlayLine = line(new LineGlowMaterial({visibilityMode: "overlay"}))
  const silhouetteLine = line(new LineGlowMaterial({visibilityMode: "silhouette"}))
  const indices = new Map([scene, basic, overlayLine, silhouetteLine].map((item, index) => [item, index]))
  state.renderObjectList(encoder, [scene], indices, false, "depth")
  state.renderObjectList(encoder, [scene], indices, false, "color")
  state.renderObjectList(encoder, [scene], indices, true)
  state.renderObjectList(encoder, [basic], indices)
  state.renderObjectList(encoder, [overlayLine], indices)
  state.renderObjectList(encoder, [silhouetteLine], indices)
  expect(pipelines).toEqual([depth, color, legacy, legacy, overlay, silhouette])
  expect(draws).toBe(6)
  renderer.dispose()
})
