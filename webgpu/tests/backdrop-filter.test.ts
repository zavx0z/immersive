import {expect, test} from "bun:test"
import {BufferGeometry, Matrix4, Mesh, Object3D, RoundedRectMaterial} from "@zavx0z/immersive-engine"
import {BackdropFilter} from "../src/renderer/backdrop-filter.ts"
import {Renderer} from "../src/renderer/index.ts"
import {setBackdrop} from "../src/backdrop.ts"
import {classifyRenderItems, type RenderItem} from "../src/renderer/utils/render-list.ts"

type Texture = GPUTexture & {destroys: number}
type Buffer = GPUBuffer & {destroys: number, value: number[]}
type Group = GPUBindGroup & {descriptor: GPUBindGroupDescriptor}

function usageGlobals() {
  const values = {
    GPUShaderStage: {FRAGMENT: 2},
    GPUBufferUsage: {UNIFORM: 1, COPY_DST: 2},
    GPUTextureUsage: {TEXTURE_BINDING: 1, COPY_DST: 2, RENDER_ATTACHMENT: 4},
  }
  const previous = Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const)
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, {configurable: true, value})
  return () => {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
}

function fixture() {
  const textures: Texture[] = []
  const buffers: Buffer[] = []
  const groups: Group[] = []
  const pipelines: GPURenderPipelineDescriptor[] = []
  const makeTexture = (width: number, height: number): Texture => {
    const texture = {width, height, destroys: 0,
      createView() { expect(texture.destroys).toBe(0)
        return {texture} },
      destroy() {texture.destroys++},
    } as unknown as Texture
    return texture
  }
  const device = {
    queue: {writeBuffer(buffer: Buffer, _offset: number, value: Float32Array) {
      expect(buffer.destroys).toBe(0)
      buffer.value = Array.from(value)
    }},
    createTexture(descriptor: GPUTextureDescriptor) {
      const extent = descriptor.size as GPUExtent3DDict
      const [width, height] = Array.isArray(descriptor.size) ? descriptor.size : [extent.width, extent.height]
      const texture = makeTexture(width!, height!)
      textures.push(texture)
      return texture
    },
    createBuffer() {
      const buffer = {destroys: 0, value: [], destroy() {buffer.destroys++}} as unknown as Buffer
      buffers.push(buffer)
      return buffer
    },
    createBindGroup(descriptor: GPUBindGroupDescriptor) {
      const group = {descriptor} as unknown as Group
      groups.push(group)
      return group
    },
    createSampler: () => ({}), createBindGroupLayout: () => ({}),
    createShaderModule: () => ({}), createPipelineLayout: () => ({}),
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor) {pipelines.push(descriptor)
      return {}},
    createRenderBundleEncoder: () => ({setPipeline() {}, setBindGroup() {}, draw() {}, finish: () => ({})}),
  } as unknown as GPUDevice
  const command = () => {
    const copies: {source: GPUTexture, destination: GPUTexture, origin: GPUOrigin3D | undefined, extent: GPUExtent3D}[] = []
    const passes: {descriptor: GPURenderPassDescriptor, group?: Group, ended: boolean, scissor?: number[]}[] = []
    const events: string[] = []
    const encoder = {
      copyTextureToTexture(source: GPUImageCopyTexture, destination: GPUImageCopyTexture, extent: GPUExtent3D) {
        copies.push({source: source.texture, destination: destination.texture, origin: source.origin, extent})
        events.push("copy")
      },
      beginRenderPass(descriptor: GPURenderPassDescriptor) {
        const record: typeof passes[number] = {descriptor, ended: false}
        passes.push(record)
        return {setPipeline() {}, setBindGroup(index: number, group: Group) {if (index === 0) record.group = group},
          draw() {}, end() {record.ended = true}, executeBundles() {},
          setViewport() {}, setScissorRect(...values: number[]) {record.scissor = values}, setStencilReference() {},
        }
      },
    } as unknown as GPUCommandEncoder
    return {encoder, copies, passes, events}
  }
  return {device, textures, buffers, groups, pipelines, makeTexture, command}
}

const uniform = (group: Group): Buffer =>
  (Array.from(group.descriptor.entries).find(entry => entry.binding === 2)!.resource as GPUBufferBinding).buffer as Buffer

test("same canvas key reuses scratch while a new swapchain texture is copied every frame", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const canvas = {}
  const firstSource = f.makeTexture(101, 53), nextSource = f.makeTexture(101, 53)
  try {
    expect(f.textures).toHaveLength(0)
    filter.beginFrame(new Set([canvas]))
    const first = f.command()
    const composite = filter.encode(first.encoder, firstSource, 5, canvas)
    filter.endFrame()
    const allocations = [...f.textures]
    const slots = [...f.buffers]
    filter.beginFrame(new Set([canvas]))
    const next = f.command()
    expect(filter.encode(next.encoder, nextSource, 6, canvas)).toBe(composite)
    filter.endFrame()
    expect(f.textures).toEqual(allocations)
    expect(f.buffers).toEqual(slots)
    expect(next.copies[0]).toMatchObject({source: nextSource, destination: first.copies[0]!.destination})
    expect(f.textures.map(texture => [texture.width, texture.height])).toEqual([[101, 53], [26, 14], [26, 14]])
    expect(firstSource.destroys + nextSource.destroys).toBe(0)
  } finally {
    filter.dispose()
    restore()
  }
})

test("multiple windows in one command buffer have independent uniforms, reused and trimmed next frame", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60)
  try {
    filter.beginFrame(new Set([source]))
    const command = f.command()
    filter.encode(command.encoder, source, 4)
    filter.encode(command.encoder, source, 8)
    const slots = command.passes.map(pass => uniform(pass.group!))
    expect(new Set(slots).size).toBe(4)
    expect(command.copies).toHaveLength(2)
    expect(command.passes.every(pass => pass.ended)).toBe(true)
    expect(slots[0]!.value[2]).toBeCloseTo(4 / 3 / 120)
    expect(slots[1]!.value[3]).toBeCloseTo(4 / 3 / 60)
    expect(slots[2]!.value[2]).toBeCloseTo(8 / 3 / 120)
    expect(slots[3]!.value[3]).toBeCloseTo(8 / 3 / 60)
    filter.endFrame()
    filter.beginFrame(new Set([source]))
    const next = f.command()
    filter.encode(next.encoder, source, 6)
    expect(next.passes.map(pass => uniform(pass.group!))).toEqual(slots.slice(0, 2))
    filter.endFrame()
    expect(slots.map(slot => slot.destroys)).toEqual([0, 0, 1, 1])
  } finally {
    filter.dispose()
    restore()
  }
})

test("resize destroys all old scale variants and rebuilds live bindings without owning source textures", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const canvas = {}, source = f.makeTexture(100, 50), resized = f.makeTexture(200, 80)
  try {
    filter.beginFrame(new Set([canvas]))
    const command = f.command()
    filter.encode(command.encoder, source, 1, canvas)
    filter.encode(command.encoder, source, 4, canvas)
    filter.endFrame()
    const old = [...f.textures]
    expect(old).toHaveLength(5)
    filter.beginFrame(new Set([canvas]))
    const next = f.command()
    filter.encode(next.encoder, resized, 4, canvas)
    filter.endFrame()
    expect(old.every(texture => texture.destroys === 1)).toBe(true)
    expect(next.copies[0]!.destination).toMatchObject({width: 200, height: 80, destroys: 0})
    for (const pass of next.passes) {
      const view = Array.from(pass.group!.descriptor.entries).find(entry => entry.binding === 0)!.resource as GPUTextureView & {texture: Texture}
      expect(view.texture.destroys).toBe(0)
    }
    expect(source.destroys + resized.destroys).toBe(0)
  } finally {
    filter.dispose()
    restore()
  }
})

test("release and inactive targets free only owned resources; empty frames trim uniform slots", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const left = f.makeTexture(80, 40), right = f.makeTexture(80, 40)
  try {
    filter.beginFrame(new Set([left, right]))
    const command = f.command()
    filter.encode(command.encoder, left, 3)
    filter.encode(command.encoder, right, 3)
    filter.endFrame()
    filter.release(left)
    filter.release(left)
    expect(f.textures.slice(0, 3).map(texture => texture.destroys)).toEqual([1, 1, 1])
    expect(f.textures.slice(3).map(texture => texture.destroys)).toEqual([0, 0, 0])
    filter.beginFrame(new Set())
    filter.endFrame()
    expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBe(true)
    expect(left.destroys + right.destroys).toBe(0)
    filter.dispose()
    expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBe(true)
  } finally {
    filter.dispose()
    restore()
  }
})

test("bounded windows copy their sampling halo and scissor work inside a larger target", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(1000, 800)
  try {
    filter.beginFrame(new Set([source]))
    const command = f.command()
    filter.encode(command.encoder, source, 8, source, {left: 100, top: 80, right: 200, bottom: 120})
    const copy = command.copies[0]!
    const extent = copy.extent as number[]
    const origin = copy.origin as GPUOrigin3DDict
    expect(origin.x).toBeLessThanOrEqual(100 - 3 * 8)
    expect(origin.y).toBeLessThanOrEqual(80 - 3 * 8)
    expect(origin.x! + extent[0]!).toBeGreaterThanOrEqual(200 + 3 * 8)
    expect(origin.y! + extent[1]!).toBeGreaterThanOrEqual(120 + 3 * 8)
    expect(extent[0]! * extent[1]!).toBeLessThan(1000 * 800 / 4)
    const horizontal = command.passes[0]!.scissor!, vertical = command.passes[1]!.scissor!
    expect(horizontal[0]).toBe(vertical[0])
    expect(horizontal[2]).toBe(vertical[2])
    expect(horizontal[1]).toBeLessThan(vertical[1]!)
    expect(horizontal[1]! + horizontal[3]!).toBeGreaterThan(vertical[1]! + vertical[3]!)
    expect(vertical[0]! * 8).toBeLessThanOrEqual(100)
    expect(vertical[1]! * 8).toBeLessThanOrEqual(80)
    expect((vertical[0]! + vertical[2]!) * 8).toBeGreaterThanOrEqual(200)
    expect((vertical[1]! + vertical[3]!) * 8).toBeGreaterThanOrEqual(120)
  } finally {
    filter.dispose()
    restore()
  }
})

test.each(["vertical-texture", "composite-binding"] as const)("failed %s allocation still releases every texture created before the failure", failure => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(80, 40)
  const createTexture = f.device.createTexture.bind(f.device)
  if (failure === "vertical-texture") f.device.createTexture = descriptor => {
    if (descriptor.label === "backdrop-vertical") throw new Error("allocation failure")
    return createTexture(descriptor)
  }
  else f.device.createBindGroup = () => {throw new Error("allocation failure")}
  try {
    filter.beginFrame(new Set([source]))
    expect(() => filter.encode(f.command().encoder, source, 4)).toThrow("allocation failure")
    filter.dispose()
    expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    expect(source.destroys).toBe(0)
  } finally {
    filter.dispose()
    restore()
  }
})

type Prepared = {
  root: Object3D
  layer: ReturnType<typeof classifyRenderItems>
  resources: {matrix: Matrix4, globalBindGroup: GPUBindGroup}
  viewport: {x: number, y: number, width: number, height: number}
  paintBackground: boolean
}

type RendererState = {
  device: GPUDevice
  context: GPUCanvasContext
  canvas: object
  presentationFormat: GPUTextureFormat
  depthTextureView: GPUTextureView
  multisampleTextureView: GPUTextureView
  backdropFilter: {encode(command: GPUCommandEncoder, texture: GPUTexture, sigma: number, key: object): GPUBindGroup} | null
  backdropPipeline: GPURenderPipeline
  renderObjectList(encoder: unknown, items: RenderItem[], indices: ReadonlyMap<RenderItem, number>, ui?: boolean): void
  renderMesh(encoder: unknown, object: Mesh, worldMatrix: Matrix4, index: number): void
  renderPreparedLayer(command: GPUCommandEncoder, view: GPUTextureView, prepared: Prepared, indices: ReadonlyMap<RenderItem, number>, clear: boolean): void
  renderBackdropUi(command: GPUCommandEncoder, view: GPUTextureView, prepared: Prepared, items: RenderItem[], indices: ReadonlyMap<RenderItem, number>): void
}

const item = (sigma?: number): RenderItem => {
  const mesh = new Mesh(new BufferGeometry(), new RoundedRectMaterial({width: 20, height: 10, radius: 0}))
  mesh.renderLayer = "ui"
  if (sigma !== undefined) setBackdrop(mesh, {sigma, width: 20, height: 10})
  return {type: "static-mesh", object: mesh, worldMatrix: mesh.matrixWorld}
}

const prepared = (items: RenderItem[], physicalWidth = 400, physicalHeight = 200): Prepared => {
  const matrix = new Matrix4()
  matrix.elements[0] = 2 / 100
  matrix.elements[5] = 2 / 50
  return {root: new Object3D(), layer: classifyRenderItems(items), resources: {matrix, globalBindGroup: {} as GPUBindGroup},
    viewport: {x: 0, y: 0, width: physicalWidth, height: physicalHeight}, paintBackground: false}
}

test("ordinary and zero-blur UI keep one normal pass without scratch allocations", () => {
  const f = fixture()
  const state = new Renderer() as unknown as RendererState
  Object.assign(state, {device: f.device, context: {}, canvas: {}, presentationFormat: "bgra8unorm",
    depthTextureView: {}, multisampleTextureView: {}, backdropFilter: null})
  const plain = item(), zero = item(0)
  const command = f.command()
  const rendered: RenderItem[] = []
  state.renderObjectList = (_pass, items) => rendered.push(...items)
  state.renderPreparedLayer(command.encoder, {} as GPUTextureView, prepared([plain, zero]), new Map(), true)
  expect(command.passes).toHaveLength(1)
  expect(command.copies).toHaveLength(0)
  expect(f.textures).toHaveLength(0)
  expect(rendered).toEqual([plain, zero])
})

test.each([
  {physicalWidth: 400, physicalHeight: 200, worldScale: 1, sigma: 12},
  {physicalWidth: 800, physicalHeight: 400, worldScale: 1, sigma: 24},
  {physicalWidth: 400, physicalHeight: 200, worldScale: 2, sigma: 24},
  {physicalWidth: 200, physicalHeight: 100, worldScale: .5, sigma: 3},
])("ordered composition converts CSS sigma for $physicalWidth physical px and scale $worldScale before foreground", ({physicalWidth, physicalHeight, worldScale, sigma}) => {
  const f = fixture()
  const state = new Renderer() as unknown as RendererState
  const source = f.makeTexture(physicalWidth, physicalHeight), canvas = {}
  const calls: {sigma: number, key: object, texture: GPUTexture}[] = []
  Object.assign(state, {context: {getCurrentTexture: () => source}, canvas, depthTextureView: {}, multisampleTextureView: {}, backdropPipeline: {},
    backdropFilter: {encode(_command: GPUCommandEncoder, texture: GPUTexture, sigma: number, key: object) {
      calls.push({texture, sigma, key})
      events.push("filter")
      return {} as GPUBindGroup
    }}})
  const behind = item(), backdrop = item(3), foreground = item(), zero = item(0), front = item()
  backdrop.worldMatrix.elements[0] = worldScale
  backdrop.worldMatrix.elements[5] = worldScale
  backdrop.worldMatrix.elements[12] = 11
  backdrop.worldMatrix.elements[13] = 9
  const items = [behind, backdrop, foreground, zero, front]
  const events: string[] = []
  state.renderObjectList = (_pass, drawItems) => events.push(...drawItems.map(value => value === behind ? "behind" : value === foreground ? "foreground" : "front"))
  state.renderMesh = () => events.push("composite")
  const command = f.command()
  const scene = prepared(items, physicalWidth, physicalHeight)
  state.renderBackdropUi(command.encoder, {} as GPUTextureView, scene, items, new Map(items.map((value, index) => [value, index])))
  expect(calls).toHaveLength(1)
  expect(calls[0]!.sigma).toBeCloseTo(sigma)
  expect(calls[0]!.texture).toBe(source)
  expect(calls[0]!.key).toBe(canvas)
  expect(events).toEqual(["behind", "filter", "composite", "foreground", "front"])
  expect(command.passes).toHaveLength(2)
  expect(command.passes.every(pass => pass.ended)).toBe(true)
})

test("world filtering uses the current borrowed depth attachment and distinct plane uniforms", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60)
  const firstDepth = f.makeTexture(120, 60), nextDepth = f.makeTexture(120, 60)
  const depthResource = (group: Group) => group.descriptor.entries.find(entry => entry.binding === 3)?.resource as GPUTextureView & {texture: Texture}
  try {
    filter.beginFrame(new Set([source]))
    const command = f.command()
    filter.encode(command.encoder, source, 4, source, undefined, {texture: firstDepth, plane: [.1, .2, .3]})
    expect(command.passes.every(pass => depthResource(pass.group!).texture === firstDepth)).toBeTrue()
    expect(uniform(command.passes[0]!.group!).value.slice(4, 7)).toEqual([Math.fround(.1), Math.fround(.2), Math.fround(.3)])
    filter.endFrame()
    filter.beginFrame(new Set([source]))
    const next = f.command()
    filter.encode(next.encoder, source, 4, source, undefined, {texture: nextDepth, plane: [.4, .5, .6]})
    expect(next.passes.every(pass => depthResource(pass.group!).texture === nextDepth)).toBeTrue()
    expect(next.passes[0]!.group !== command.passes[0]!.group).toBeTrue()
    filter.dispose()
    expect([firstDepth.destroys, nextDepth.destroys]).toEqual([0, 0])
  } finally {
    filter.dispose()
    restore()
  }
})
