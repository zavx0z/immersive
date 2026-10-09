import {expect, test} from "bun:test"
import {BufferGeometry, Matrix4, Mesh, Object3D, RoundedRectMaterial, Text, TextMaterial, TrueTypeFont} from "@zavx0z/immersive-engine"
import {BackdropFilter} from "../src/renderer/backdrop-filter.ts"
import {Renderer} from "../src/renderer/index.ts"
import {setBackdrop} from "../src/backdrop.ts"
import {classifyRenderItems, type RenderItem} from "../src/renderer/utils/render-list.ts"
import {FrameInputState} from "../src/renderer/frame-input-state.ts"

type Texture = GPUTexture & {destroys: number, descriptor?: GPUTextureDescriptor}
type Buffer = GPUBuffer & {destroys: number, value: number[]}
type Group = GPUBindGroup & {descriptor: GPUBindGroupDescriptor}

function usageGlobals() {
  const values = {
    GPUShaderStage: {FRAGMENT: 2, COMPUTE: 4},
    GPUBufferUsage: {UNIFORM: 1, COPY_DST: 2},
    GPUTextureUsage: {TEXTURE_BINDING: 1, COPY_DST: 2, RENDER_ATTACHMENT: 4, STORAGE_BINDING: 8},
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
  const layouts: GPUBindGroupLayoutDescriptor[] = []
  const makeTexture = (width: number, height: number, sampleCount = 1): Texture => {
    const texture = {width, height, sampleCount, destroys: 0,
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
      const texture = makeTexture(width!, height!, descriptor.sampleCount ?? 1)
      texture.descriptor = descriptor
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
    createSampler: () => ({}), createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor) {
      layouts.push(descriptor)
      return {}
    },
    createShaderModule: () => ({}), createPipelineLayout: () => ({}),
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor) {pipelines.push(descriptor)
      return {}},
    createComputePipeline: () => ({}),
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
      beginComputePass(descriptor: GPUComputePassDescriptor) {
        const record: typeof passes[number] = {descriptor: {...descriptor, colorAttachments: []}, ended: false}
        passes.push(record)
        return {setPipeline() {}, setBindGroup(index: number, group: Group) {if (index === 0) record.group = group},
          dispatchWorkgroups(width: number, height: number) {
            const data = uniform(record.group!).value
            record.scissor = [data[8]!, data[9]!, width, height]
          }, end() {record.ended = true},
        }
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
  return {device, textures, buffers, groups, pipelines, layouts, makeTexture, command}
}

const uniform = (group: Group): Buffer =>
  (Array.from(group.descriptor.entries).find(entry => entry.binding === 2)!.resource as GPUBufferBinding).buffer as Buffer

test("single-sample and MSAA sources select compatible layouts without owning or writing the borrowed sources", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const key = {}, single = Object.freeze(f.makeTexture(80, 40)), multisample = Object.freeze(f.makeTexture(80, 40, 4))
  try {
    for (const source of [single, multisample]) {
      filter.beginFrame(new Set([key]))
      const command = f.command()
      filter.encode(command.encoder, source, 4, key)
      filter.endFrame()
      expect(command.copies).toHaveLength(0)
      expect(command.passes).toHaveLength(3)
      const sampled = command.passes[0]!.group!.descriptor.entries.find(entry => entry.binding === 0)!.resource as GPUTextureView & {texture: Texture}
      expect(sampled.texture).toBe(source)
    }
    const filterLayouts = f.layouts.map(layout => Array.from(layout.entries).find(entry => entry.binding === 0)?.texture)
      .filter(texture => texture?.sampleType !== undefined)
    expect([...new Map(filterLayouts.map(texture => [JSON.stringify(texture), texture])).values()]).toEqual([
      {multisampled: false, sampleType: "float"},
      {multisampled: true, sampleType: "unfilterable-float"},
    ])
    expect(f.textures).toHaveLength(5)
    filter.dispose()
    expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBe(true)
    expect([single.destroys, multisample.destroys]).toEqual([0, 0])
  } finally {
    filter.dispose()
    restore()
  }
})

test("same canvas key reuses scratch while changing borrowed MSAA source bindings without snapshots", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const canvas = {}
  const firstSource = Object.freeze(f.makeTexture(101, 53, 4)), nextSource = Object.freeze(f.makeTexture(101, 53, 4))
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
    expect(first.copies).toHaveLength(0)
    expect(next.copies).toHaveLength(0)
    expect(f.textures.map(texture => [texture.width, texture.height])).toEqual(Array.from({length: 5}, () => [26, 14]))
    expect(f.textures.map(texture => texture.descriptor?.label)).toEqual(["backdrop-prefilter", "backdrop-prefilter-validity", "backdrop-horizontal", "backdrop-horizontal-validity", "backdrop-vertical"])
    const sampled = (group: Group) => (Array.from(group.descriptor.entries).find(entry => entry.binding === 0)!.resource as GPUTextureView & {texture: Texture}).texture
    expect(sampled(first.passes[0]!.group!)).toBe(firstSource)
    expect(sampled(next.passes[0]!.group!)).toBe(nextSource)
    expect(next.passes[0]!.group).not.toBe(first.passes[0]!.group)
    expect(next.passes[1]!.group).toBe(first.passes[1]!.group)
    expect(sampled(composite as Group)).toBe(f.textures[4]!)
    expect(uniform(composite as Group).value).toEqual([101, 53, 0, 0])
    expect(first.passes.concat(next.passes).every(pass => Array.from(pass.descriptor.colorAttachments).every(attachment =>
      (attachment?.view as GPUTextureView & {texture: Texture}).texture !== firstSource &&
      (attachment?.view as GPUTextureView & {texture: Texture}).texture !== nextSource && attachment?.resolveTarget === undefined))).toBe(true)
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
    expect(new Set(slots).size).toBe(6)
    expect(command.copies).toHaveLength(0)
    expect(command.passes.every(pass => pass.ended)).toBe(true)
    expect(slots[0]!.value.slice(0, 2)).toEqual([Math.fround(1 / 30), Math.fround(1 / 15)])
    expect(slots[1]!.value[2]).toBeCloseTo(1 / 30)
    expect(slots[2]!.value[3]).toBeCloseTo(1 / 15)
    expect(slots[4]!.value[2]).toBeCloseTo(1 / 15)
    expect(slots[5]!.value[3]).toBeCloseTo(1 / 8)
    filter.endFrame()
    filter.beginFrame(new Set([source]))
    const next = f.command()
    filter.encode(next.encoder, source, 6)
    expect(next.passes.map(pass => uniform(pass.group!))).toEqual(slots.slice(0, 3))
    filter.endFrame()
    expect(slots.map(slot => slot.destroys)).toEqual([0, 0, 0, 1, 1, 1])
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
    expect(old).toHaveLength(10)
    const oldInfo = f.buffers[0]!
    filter.beginFrame(new Set([canvas]))
    const next = f.command()
    const composite = filter.encode(next.encoder, resized, 4, canvas)
    filter.endFrame()
    expect(old.every(texture => texture.destroys === 1)).toBe(true)
    expect(next.copies).toHaveLength(0)
    expect(oldInfo.destroys).toBe(1)
    expect(uniform(composite as Group).value).toEqual([200, 80, 0, 0])
    expect(f.textures.slice(old.length).map(texture => [texture.width, texture.height])).toEqual(Array.from({length: 5}, () => [50, 20]))
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
    expect(f.textures).toHaveLength(10)
    expect(f.textures.slice(0, 5).map(texture => texture.destroys)).toEqual([1, 1, 1, 1, 1])
    expect(f.textures.slice(5).map(texture => texture.destroys)).toEqual([0, 0, 0, 0, 0])
    expect(f.buffers[0]!.destroys).toBe(1)
    expect(f.buffers.slice(1).every(buffer => buffer.destroys === 0)).toBe(true)
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

test("bounded windows sample borrowed MSAA directly and scissor the two Gaussian passes including vertical halo", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = Object.freeze(f.makeTexture(1000, 800, 4))
  try {
    filter.beginFrame(new Set([source]))
    const command = f.command()
    filter.encode(command.encoder, source, 8, source, {left: 100, top: 80, right: 200, bottom: 120})
    expect(command.copies).toHaveLength(0)
    expect(f.textures.map(texture => [texture.width, texture.height])).toEqual(Array.from({length: 5}, () => [125, 100]))
    const prefilter = command.passes[0]!.scissor!, horizontal = command.passes[1]!.scissor!, vertical = command.passes[2]!.scissor!
    expect(prefilter[0]).toBeLessThan(horizontal[0]!)
    expect(prefilter[0]! + prefilter[2]!).toBeGreaterThan(horizontal[0]! + horizontal[2]!)
    expect(horizontal[0]).toBe(vertical[0])
    expect(horizontal[2]).toBe(vertical[2])
    expect(horizontal[1]).toBeLessThan(vertical[1]!)
    expect(horizontal[1]! + horizontal[3]!).toBeGreaterThan(vertical[1]! + vertical[3]!)
    expect(horizontal[1]! * 8).toBeLessThanOrEqual(80 - 3 * 8)
    expect((horizontal[1]! + horizontal[3]!) * 8).toBeGreaterThanOrEqual(120 + 3 * 8)
    expect(horizontal[2]! * horizontal[3]! * 8 * 8).toBeLessThan(1000 * 800 / 4)
    expect(vertical[0]! * 8).toBeLessThanOrEqual(100)
    expect(vertical[1]! * 8).toBeLessThanOrEqual(80)
    expect((vertical[0]! + vertical[2]!) * 8).toBeGreaterThanOrEqual(200)
    expect((vertical[1]! + vertical[3]!) * 8).toBeGreaterThanOrEqual(120)
  } finally {
    filter.dispose()
    restore()
  }
})

test.each(["backdrop-prefilter", "backdrop-prefilter-validity", "backdrop-horizontal", "backdrop-horizontal-validity", "backdrop-vertical", "composite-binding"] as const)("failed %s allocation still releases every texture created before the failure", failure => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(80, 40)
  const createTexture = f.device.createTexture.bind(f.device)
  if (failure !== "composite-binding") f.device.createTexture = descriptor => {
    if (descriptor.label === failure) throw new Error("allocation failure")
    return createTexture(descriptor)
  }
  else f.device.createBindGroup = () => {throw new Error("allocation failure")}
  try {
    filter.beginFrame(new Set([source]))
    expect(() => filter.encode(f.command().encoder, source, 4)).toThrow("allocation failure")
    filter.dispose()
    expect(f.textures.length).toBe(["backdrop-prefilter", "backdrop-prefilter-validity", "backdrop-horizontal", "backdrop-horizontal-validity", "backdrop-vertical", "composite-binding"].indexOf(failure))
    expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    expect(f.buffers.length).toBeGreaterThan(0)
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBe(true)
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
  multisampleTexture: GPUTexture
  backdropFilter: {encode(command: GPUCommandEncoder, texture: GPUTexture, sigma: number, key: object): GPUBindGroup} | null
  backdropPipeline: GPURenderPipeline
  backdropAlphaPipeline: GPURenderPipeline | null
  renderObjectList(encoder: unknown, items: RenderItem[], indices: ReadonlyMap<RenderItem, number>, ui?: boolean): void
  renderMesh(encoder: unknown, object: Mesh, worldMatrix: Matrix4, index: number): void
  renderPreparedLayer(command: GPUCommandEncoder, view: GPUTextureView, prepared: Prepared, indices: ReadonlyMap<RenderItem, number>, clear: boolean): void
  renderBackdropUi(command: GPUCommandEncoder, view: GPUTextureView, prepared: Prepared, items: RenderItem[], indices: ReadonlyMap<RenderItem, number>, raster?: {texture: GPUTexture, multisample: GPUTexture, depth: GPUTexture}): void
}

function rendererState(): RendererState {
  const renderer = new Renderer()
  const state = renderer as unknown as RendererState
  // Эти CPU-проверки порядка draw не сертифицируют полный scene prefix.
  Object.assign(state, {backdropFrame: {items: [], layers: [], clips: new Float32Array(), indices: new Map(), pending: [], reusable: true},
    readFrameInputs: () => null})
  return state
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
  const state = rendererState()
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
  const state = rendererState()
  const source = f.makeTexture(physicalWidth, physicalHeight), canvas = {}
  const calls: {sigma: number, key: object, texture: GPUTexture}[] = []
  Object.assign(state, {context: {getCurrentTexture: () => {throw new Error("Backdrop must borrow MSAA, not the resolved canvas")}}, multisampleTexture: source, canvas, depthTextureView: {}, multisampleTextureView: {}, backdropPipeline: {},
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

test.each(["dual", "portable"] as const)("%s multiple-panel UI has one final resolve and no copies or full-resolution snapshots", mode => {
  const restore = usageGlobals()
  const f = fixture()
  const state = rendererState()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(400, 200, 4)
  const canvas = {width: 400, height: 200}
  const resolvedView = {} as GPUTextureView
  Object.assign(state, {device: f.device, context: {getCurrentTexture: () => {throw new Error("No resolved canvas snapshot")}}, canvas,
    presentationFormat: "bgra8unorm", depthTextureView: {}, multisampleTexture: source, multisampleTextureView: source.createView(),
    backdropFilter: filter, backdropPipeline: {}, backdropAlphaPipeline: mode === "portable" ? {} : null})
  const behind = item(), first = item(3), child = item(), second = item(3), between = item(), third = item(3), zero = item(0), front = item()
  const items = [behind, first, child, second, between, third, zero, front]
  const drawn: RenderItem[] = [], composites: Object3D[] = []
  state.renderObjectList = (_pass, values) => drawn.push(...values)
  state.renderMesh = (_pass, mesh) => composites.push(mesh)
  try {
    filter.beginFrame(new Set([canvas]))
    const command = f.command()
    state.renderPreparedLayer(command.encoder, resolvedView, prepared(items), new Map(items.map((value, index) => [value, index])), true)
    filter.endFrame()
    const resolved = command.passes.flatMap((pass, index) => Array.from(pass.descriptor.colorAttachments)
      .filter(attachment => attachment?.resolveTarget !== undefined).map(attachment => ({index, attachment})))
    expect(resolved).toHaveLength(1)
    expect(resolved[0]!.index).toBe(command.passes.length - 1)
    expect(resolved[0]!.attachment!.resolveTarget).toBe(resolvedView)
    expect(command.passes.every(pass => pass.ended)).toBe(true)
    const uiPasses = command.passes.filter(pass => pass.descriptor.label === "ui-backdrop-ordered")
    expect(uiPasses).toHaveLength(3)
    for (const pass of uiPasses) {
      expect(pass.descriptor.depthStencilAttachment).toMatchObject({depthReadOnly: true, stencilReadOnly: true})
      expect(pass.descriptor.depthStencilAttachment!.depthLoadOp).toBeUndefined()
      expect(pass.descriptor.depthStencilAttachment!.depthStoreOp).toBeUndefined()
      expect(pass.descriptor.depthStencilAttachment!.stencilLoadOp).toBeUndefined()
      expect(pass.descriptor.depthStencilAttachment!.stencilStoreOp).toBeUndefined()
    }
    expect(command.copies).toHaveLength(0)
    expect(f.textures.map(texture => [texture.width, texture.height])).toEqual(Array.from({length: 8}, () => [50, 25]))
    expect(f.textures.map(texture => texture.descriptor?.label)).toEqual(["backdrop-prefilter", "backdrop-prefilter-validity", "backdrop-horizontal", "backdrop-horizontal-validity", "backdrop-vertical",
      "backdrop-cached-output", "backdrop-cached-output", "backdrop-cached-output"])
    expect(drawn).toEqual([behind, child, between, front])
    expect(composites).toEqual(mode === "dual" ? [first.object, second.object, third.object]
      : [first.object, first.object, second.object, second.object, third.object, third.object])
    expect(f.buffers).toHaveLength(10)
    filter.dispose()
    expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBe(true)
    expect(source.destroys).toBe(0)
  } finally {
    filter.dispose()
    restore()
  }
})

test("raster composition borrows its MSAA attachment while retaining the resolved texture only as cache key", () => {
  const f = fixture()
  const state = rendererState()
  const canvasSource = f.makeTexture(400, 200, 4)
  const raster = {texture: f.makeTexture(200, 100), multisample: f.makeTexture(200, 100, 4), depth: f.makeTexture(200, 100, 4)}
  const calls: {
    source: GPUTexture
    key: object
  }[] = []
  Object.assign(state, {multisampleTexture: canvasSource, canvas: {}, depthTextureView: {}, multisampleTextureView: {}, backdropPipeline: {},
    backdropFilter: {encode(_command: GPUCommandEncoder, source: GPUTexture, _sigma: number, key: object) {
      calls.push({source, key})
      return {} as GPUBindGroup
    }}})
  state.renderObjectList = () => {}
  state.renderMesh = () => {}
  const backdrop = item(3), command = f.command(), resolvedView = raster.texture.createView()
  state.renderBackdropUi(command.encoder, resolvedView, prepared([backdrop], 200, 100), [backdrop], new Map([[backdrop, 0]]), raster)
  expect(calls).toEqual([{source: raster.multisample, key: raster.texture}])
  expect(command.copies).toHaveLength(0)
  expect(command.passes).toHaveLength(1)
  const attachment = Array.from(command.passes[0]!.descriptor.colorAttachments)[0]!
  expect((attachment.view as GPUTextureView & {texture: Texture}).texture).toBe(raster.multisample)
  expect(attachment.resolveTarget).toBe(resolvedView)
  expect([canvasSource.destroys, raster.texture.destroys, raster.multisample.destroys, raster.depth.destroys]).toEqual([0, 0, 0, 0])
})

test("UI continuation access includes complete text pairs on both sides of blur boundaries", async () => {
  const f = fixture()
  const state = rendererState()
  const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/font/inter-regular.ttf", import.meta.url)).arrayBuffer())
  const texts = [false, true, false].map(depthWrite => new Text("UI", font, 12, new TextMaterial({depthWrite})))
  const textItems = (object: Text): RenderItem[] => ["text-stencil", "text-cover"].map(type =>
    ({type: type as RenderItem["type"], object, worldMatrix: object.matrixWorld}))
  const first = item(3), second = item(3), zero = item(0), front = item()
  const items = [...textItems(texts[0]!), first, ...textItems(texts[1]!), second, ...textItems(texts[2]!), zero, front]
  const source = f.makeTexture(400, 200, 4)
  Object.assign(state, {multisampleTexture: source, canvas: {}, depthTextureView: {}, multisampleTextureView: {}, backdropPipeline: {},
    backdropFilter: {encode(...args: Parameters<BackdropFilter["encode"]>) {
      args[6]?.beforeFilter?.()
      return {} as GPUBindGroup
    }}})
  const drawn: RenderItem[][] = []
  state.renderObjectList = (_pass, values) => {if (values.length > 0) drawn.push(values)}
  state.renderMesh = () => {}
  try {
    const command = f.command()
    state.renderBackdropUi(command.encoder, {} as GPUTextureView, prepared(items), items, new Map(items.map((value, index) => [value, index])))
    expect(command.passes).toHaveLength(3)
    expect(command.passes.map(pass => pass.descriptor.depthStencilAttachment?.depthReadOnly === true)).toEqual([false, false, true])
    for (const pass of command.passes) expect(pass.descriptor.depthStencilAttachment?.stencilReadOnly === true).toBe(false)
    expect(command.passes[1]!.descriptor.depthStencilAttachment).toMatchObject({depthLoadOp: "load", depthStoreOp: "store"})
    const flattened = drawn.flat()
    expect(flattened).toEqual([...textItems(texts[0]!), ...textItems(texts[1]!), ...textItems(texts[2]!), front])
    for (const object of texts) {
      const chunk = drawn.find(values => values.some(value => value.object === object))!
      expect(chunk.filter(value => value.object === object).map(value => value.type)).toEqual(["text-stencil", "text-cover"])
    }
    expect(command.passes.every(pass => pass.ended)).toBe(true)
  } finally {texts.forEach(object => object.dispose())}
})

test("real filter cache hits merge three UI composites while preserving complete text pairs and one final resolve", async () => {
  const restore = usageGlobals()
  const f = fixture()
  const state = rendererState() as RendererState & {backdropInputStates: FrameInputState[]}
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(400, 200, 4), canvas = {width: 400, height: 200}
  const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/font/inter-regular.ttf", import.meta.url)).arrayBuffer())
  const texts = [false, true, false].map(depthWrite => {
    const object = new Text("UI", font, 12, new TextMaterial({depthWrite}))
    object.renderLayer = "ui"
    return object
  })
  const textItems = (object: Text): RenderItem[] => ["text-stencil", "text-cover"].map(type =>
    ({type: type as RenderItem["type"], object, worldMatrix: object.matrixWorld}))
  const backdrops = [item(3), item(3), item(3)]
  const items = backdrops.flatMap((backdrop, index) => [backdrop, ...textItems(texts[index]!)])
  const indices = new Map(items.map((value, index) => [value, index]))
  const scene = prepared(items)
  const resolvedView = {} as GPUTextureView
  // Тест фиксирует входы сцены и явно подтверждает prefix после cold submission.
  const inputs = {references: [source, ...items.map(value => value.object)], data: []}
  Object.assign(state, {device: f.device, context: {}, canvas, presentationFormat: "bgra8unorm", depthTextureView: {},
    multisampleTexture: source, multisampleTextureView: source.createView(), backdropFilter: filter,
    backdropPipeline: {}, backdropAlphaPipeline: null, readFrameInputs: () => inputs})
  let events: string[] = []
  state.renderObjectList = (_pass, values) => events.push(...values.map(value => `${texts.indexOf(value.object as Text)}:${value.type}`))
  state.renderMesh = (_pass, object) => events.push(`backdrop:${backdrops.findIndex(value => value.object === object)}`)
  const render = () => {
    Object.assign(state, {backdropFrame: {items: [], layers: [scene], clips: new Float32Array(), indices, pending: [], reusable: true}})
    filter.beginFrame(new Set([canvas]))
    events = []
    const command = f.command()
    state.renderPreparedLayer(command.encoder, resolvedView, scene, indices, true)
    filter.endFrame()
    return {command, events: [...events]}
  }
  try {
    const cold = render()
    expect(cold.command.passes.filter(pass => pass.descriptor.label === "backdrop-blur")).toHaveLength(9)
    expect(cold.command.passes.filter(pass => pass.descriptor.label === "ui-backdrop-ordered")).toHaveLength(3)
    state.backdropInputStates.forEach(prefix => prefix.commit(inputs))
    const warm = render()
    expect(warm.command.passes).toHaveLength(3)
    expect(warm.command.passes.filter(pass => pass.descriptor.label === "backdrop-blur")).toHaveLength(0)
    const merged = warm.command.passes.filter(pass => pass.descriptor.label === "ui-backdrop-ordered")
    expect(merged).toHaveLength(1)
    expect(merged[0]!.descriptor.depthStencilAttachment?.depthReadOnly === true).toBe(false)
    expect(merged[0]!.descriptor.depthStencilAttachment?.stencilReadOnly === true).toBe(false)
    expect(warm.command.passes.filter(pass => pass.descriptor.label === "backdrop-final-resolve")).toHaveLength(1)
    const resolves = warm.command.passes.flatMap(pass => Array.from(pass.descriptor.colorAttachments).filter(attachment => attachment?.resolveTarget !== undefined))
    expect(resolves).toHaveLength(1)
    expect(resolves[0]!.resolveTarget).toBe(resolvedView)
    expect(warm.events).toEqual(cold.events)
    expect(warm.events).toEqual(["backdrop:0", "0:text-stencil", "0:text-cover", "backdrop:1", "1:text-stencil", "1:text-cover",
      "backdrop:2", "2:text-stencil", "2:text-cover"])
    expect(warm.command.passes.every(pass => pass.ended)).toBe(true)
  } finally {
    texts.forEach(object => object.dispose())
    filter.dispose()
    restore()
  }
})

test("world filtering uses the current borrowed depth attachment and distinct plane uniforms", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60, 4)
  const firstDepth = f.makeTexture(120, 60, 4), nextDepth = f.makeTexture(120, 60, 4)
  const depthResource = (group: Group) => group.descriptor.entries.find(entry => entry.binding === 3)?.resource as GPUTextureView & {texture: Texture}
  try {
    filter.beginFrame(new Set([source]))
    const command = f.command()
    filter.encode(command.encoder, source, 4, source, undefined, {texture: firstDepth, plane: [.1, .2, .3]})
    expect(depthResource(command.passes[0]!.group!).texture).toBe(firstDepth)
    expect(command.passes.slice(1).every(pass => depthResource(pass.group!).texture.descriptor?.label?.endsWith("validity"))).toBeTrue()
    expect(uniform(command.passes[0]!.group!).value.slice(4, 7)).toEqual([Math.fround(.1), Math.fround(.2), Math.fround(.3)])
    filter.endFrame()
    filter.beginFrame(new Set([source]))
    const next = f.command()
    filter.encode(next.encoder, source, 4, source, undefined, {texture: nextDepth, plane: [.4, .5, .6]})
    expect(depthResource(next.passes[0]!.group!).texture).toBe(nextDepth)
    expect(next.passes[0]!.group !== command.passes[0]!.group).toBeTrue()
    filter.dispose()
    expect([firstDepth.destroys, nextDepth.destroys]).toEqual([0, 0])
  } finally {
    filter.dispose()
    restore()
  }
})

test("submitted operation hit skips Gaussian passes and uniform writes while source reuse is decided by caller", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const canvas = {}, operation = {}
  const source = f.makeTexture(120, 60, 4), nextSource = f.makeTexture(120, 60, 4)
  try {
    filter.beginFrame(new Set([canvas]))
    const first = f.command()
    const group = filter.encode(first.encoder, source, 4, canvas, undefined, undefined, {key: operation, reusable: false}) as Group
    const output = (group.descriptor.entries.find(entry => entry.binding === 0)!.resource as GPUTextureView & {texture: Texture}).texture
    expect(output.descriptor?.label).toBe("backdrop-cached-output")
    expect((Array.from(first.passes[2]!.descriptor.colorAttachments)[0]!.view as GPUTextureView & {texture: Texture}).texture).toBe(output)
    expect(uniform(group).value).toEqual([120, 60, 0, 0])
    filter.endFrame()
    const buffers = [...f.buffers]
    const values = buffers.map(buffer => buffer.value)
    filter.beginFrame(new Set([canvas]))
    const next = f.command()
    expect(filter.encode(next.encoder, nextSource, 4, canvas, undefined, undefined, {key: operation, reusable: true})).toBe(group)
    expect(next.passes).toHaveLength(0)
    expect(next.copies).toHaveLength(0)
    filter.endFrame()
    expect(f.buffers).toEqual(buffers)
    buffers.forEach((buffer, index) => expect(buffer.value).toBe(values[index]!))
    expect(buffers.every(buffer => buffer.destroys === 0)).toBe(true)
    filter.beginFrame(new Set([canvas]))
    const changed = f.command()
    expect(filter.encode(changed.encoder, nextSource, 4, canvas, undefined, undefined, {key: operation, reusable: false})).toBe(group)
    expect(changed.passes).toHaveLength(3)
    expect((changed.passes[0]!.group!.descriptor.entries.find(entry => entry.binding === 0)!.resource as GPUTextureView & {texture: Texture}).texture).toBe(nextSource)
    filter.endFrame()
  } finally {
    filter.dispose()
    restore()
  }
})

test("beforeFilter runs once before the first Gaussian pass on miss and never on a submitted cache hit", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60, 4), canvas = {}, operation = {}
  const encode = (reusable: boolean) => {
    const command = f.command()
    const events: string[] = []
    const beginRenderPass = command.encoder.beginRenderPass.bind(command.encoder)
    command.encoder.beginRenderPass = descriptor => {
      events.push(descriptor.label ?? "unlabelled-pass")
      return beginRenderPass(descriptor)
    }
    const beginComputePass = command.encoder.beginComputePass.bind(command.encoder)
    command.encoder.beginComputePass = descriptor => {
      events.push(descriptor?.label ?? "unlabelled-pass")
      return beginComputePass(descriptor)
    }
    const group = filter.encode(command.encoder, source, 4, canvas, undefined, undefined, {
      key: operation,
      reusable,
      beforeFilter() {
        expect(command.passes).toHaveLength(0)
        events.push("beforeFilter")
      },
    })
    return {command, events, group}
  }
  try {
    filter.beginFrame(new Set([canvas]))
    const first = encode(false)
    expect(first.events).toEqual(["beforeFilter", "backdrop-blur", "backdrop-blur", "backdrop-blur"])
    expect(first.command.passes.every(pass => pass.ended)).toBe(true)
    filter.endFrame()
    filter.beginFrame(new Set([canvas]))
    const hit = encode(true)
    expect(hit.group).toBe(first.group)
    expect(hit.events).toEqual([])
    expect(hit.command.passes).toHaveLength(0)
    filter.endFrame()
    filter.beginFrame(new Set([canvas]))
    const changed = encode(false)
    expect(changed.events).toEqual(["beforeFilter", "backdrop-blur", "backdrop-blur", "backdrop-blur"])
    filter.endFrame()
  } finally {
    filter.dispose()
    restore()
  }
})

test("aborted filter frame never validates pending output and can release target before retry", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60, 4), canvas = {}, operation = {}
  try {
    filter.beginFrame(new Set([canvas]))
    filter.encode(f.command().encoder, source, 4, canvas, undefined, undefined, {key: operation, reusable: false})
    filter.abortFrame()
    filter.beginFrame(new Set([canvas]))
    const retry = f.command()
    filter.encode(retry.encoder, source, 4, canvas, undefined, undefined, {key: operation, reusable: true})
    expect(retry.passes).toHaveLength(3)
    filter.endFrame()
    filter.beginFrame(new Set([canvas]))
    const hit = f.command()
    filter.encode(hit.encoder, source, 4, canvas, undefined, undefined, {key: operation, reusable: true})
    expect(hit.passes).toHaveLength(0)
    filter.abortFrame()
    filter.release(canvas)
    expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    expect(f.buffers[0]!.destroys).toBe(1)
    expect(source.destroys).toBe(0)
    filter.beginFrame(new Set())
    filter.endFrame()
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBe(true)
  } finally {
    filter.dispose()
    restore()
  }
})

test("cached outputs are released before borrowed size uniform on resize and are pruned on an unused operation", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60, 4), resized = f.makeTexture(200, 100, 4), canvas = {}, operation = {}
  try {
    filter.beginFrame(new Set([canvas]))
    filter.encode(f.command().encoder, source, 4, canvas, undefined, undefined, {key: operation, reusable: false})
    filter.endFrame()
    const info = f.buffers[0]!
    const output = f.textures.find(texture => texture.descriptor?.label === "backdrop-cached-output")!
    const destroy = output.destroy.bind(output)
    output.destroy = () => {
      expect(info.destroys).toBe(0)
      destroy()
    }
    filter.beginFrame(new Set([canvas]))
    const next = f.command()
    filter.encode(next.encoder, resized, 4, canvas, undefined, undefined, {key: operation, reusable: true})
    expect(next.passes).toHaveLength(3)
    expect(output.destroys).toBe(1)
    expect(info.destroys).toBe(1)
    filter.endFrame()
    const replacement = f.textures.at(-1)!
    filter.beginFrame(new Set([canvas]))
    filter.endFrame()
    expect(replacement.destroys).toBe(1)
    expect([source.destroys, resized.destroys]).toEqual([0, 0])
  } finally {
    filter.dispose()
    restore()
  }
})

test("output budget fallback renders into shared V without evicting earlier operations", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  // Только fake metadata: три 1500×1500 RGBA outputs помещаются в 32 MiB, четыре нет.
  const source = f.makeTexture(12000, 12000, 4), canvas = {}
  const operations = Array.from({length: 4}, () => ({}))
  try {
    filter.beginFrame(new Set([canvas]))
    const first = f.command()
    const groups = operations.map(key => filter.encode(first.encoder, source, 8, canvas, undefined, undefined, {key, reusable: false}))
    const outputs = groups.map(group => (Array.from((group as Group).descriptor.entries).find(entry => entry.binding === 0)!.resource as GPUTextureView & {texture: Texture}).texture)
    expect(outputs.slice(0, 3).every(texture => texture.descriptor?.label === "backdrop-cached-output")).toBe(true)
    expect(outputs[3]!.descriptor?.label).toBe("backdrop-vertical")
    expect(f.textures).toHaveLength(8)
    expect(f.textures.every(texture => texture.destroys === 0)).toBe(true)
    filter.endFrame()
    filter.beginFrame(new Set([canvas]))
    const next = f.command()
    operations.forEach(key => filter.encode(next.encoder, source, 8, canvas, undefined, undefined, {key, reusable: true}))
    expect(next.passes).toHaveLength(3)
    filter.endFrame()
    expect(f.textures).toHaveLength(8)
  } finally {
    filter.dispose()
    restore()
  }
})

test("cache-hit cursor gaps retain dense distinct parameter slots for later misses", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60, 4), canvas = {}, a = {}, b = {}, c = {}
  const encode = (command: GPUCommandEncoder, key: object, reusable: boolean) =>
    filter.encode(command, source, 4, canvas, undefined, undefined, {key, reusable})
  try {
    filter.beginFrame(new Set([canvas]))
    encode(f.command().encoder, a, false)
    filter.endFrame()
    filter.beginFrame(new Set([canvas]))
    const middle = f.command()
    encode(middle.encoder, b, false)
    encode(middle.encoder, a, true)
    encode(middle.encoder, c, false)
    const used = middle.passes.map(pass => uniform(pass.group!))
    expect(new Set(used).size).toBe(6)
    filter.endFrame()
    const allocations = f.buffers.length
    filter.beginFrame(new Set([canvas]))
    const next = f.command()
    encode(next.encoder, b, true)
    encode(next.encoder, a, true)
    encode(next.encoder, c, false)
    expect(next.passes.map(pass => uniform(pass.group!))).toEqual(used.slice(3))
    expect(f.buffers).toHaveLength(allocations)
    filter.endFrame()
    expect(f.buffers.every(buffer => buffer.destroys === 0)).toBe(true)
  } finally {
    filter.dispose()
    restore()
  }
})

test("empty ROI never publishes an unrendered cached output", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(120, 60, 4), canvas = {}, operation = {}
  try {
    filter.beginFrame(new Set([canvas]))
    const empty = f.command()
    filter.encode(empty.encoder, source, 4, canvas, {left: 200, top: 200, right: 220, bottom: 220}, undefined, {key: operation, reusable: true})
    expect(empty.passes).toHaveLength(0)
    expect(f.textures.every(texture => texture.descriptor?.label !== "backdrop-cached-output")).toBe(true)
    filter.endFrame()
    filter.beginFrame(new Set([canvas]))
    const live = f.command()
    filter.encode(live.encoder, source, 4, canvas, undefined, undefined, {key: operation, reusable: true})
    expect(live.passes).toHaveLength(3)
    filter.endFrame()
  } finally {
    filter.dispose()
    restore()
  }
})

test("large dense kernels grow uniform slots atomically and allocation failure leaves retryable live bindings", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(2048, 1024, 4)
  const allocate = f.device.createBuffer.bind(f.device)
  try {
    filter.beginFrame(new Set([source]))
    filter.encode(f.command().encoder, source, 8)
    filter.endFrame()
    const original = [...f.buffers]
    f.device.createBuffer = descriptor => {
      if (descriptor.size > 352) throw new Error("uniform allocation failure")
      return allocate(descriptor)
    }
    filter.beginFrame(new Set([source]))
    expect(() => filter.encode(f.command().encoder, source, 100)).toThrow("uniform allocation failure")
    expect(original.every(buffer => buffer.destroys === 0)).toBeTrue()
    filter.abortFrame()
    f.device.createBuffer = allocate
    filter.beginFrame(new Set([source]))
    filter.encode(f.command().encoder, source, 8)
    filter.endFrame()
    expect(f.buffers).toEqual(original)
    filter.beginFrame(new Set([source]))
    const large = f.command()
    filter.encode(large.encoder, source, 100)
    filter.endFrame()
    expect(original.map(buffer => buffer.destroys)).toEqual([0, 0, 1, 1])
    expect(new Set(large.passes.map(pass => uniform(pass.group!))).size).toBe(3)
    filter.dispose()
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBeTrue()
    expect(f.textures.every(texture => texture.destroys === 1)).toBeTrue()
  } finally {
    filter.dispose()
    restore()
  }
})

test("compute area prefilter rebinds storage outputs when the same source changes reduced scale", () => {
  const restore = usageGlobals()
  const f = fixture()
  const filter = new BackdropFilter(f.device, "bgra8unorm")
  const source = f.makeTexture(256, 128, 4)
  const encode = (sigma: number) => {
    filter.beginFrame(new Set([source]))
    const command = f.command()
    filter.encode(command.encoder, source, sigma)
    filter.endFrame()
    return command.passes[0]!
  }
  const storage = (group: Group, binding: number) =>
    (group.descriptor.entries.find(entry => entry.binding === binding)!.resource as GPUTextureView & {texture: Texture}).texture
  try {
    const first = encode(4), second = encode(8), repeated = encode(8)
    expect(first.group).not.toBe(second.group)
    expect(second.group).toBe(repeated.group)
    expect([storage(first.group!, 4).width, storage(second.group!, 4).width]).toEqual([64, 32])
    expect(storage(second.group!, 5).descriptor?.format).toBe("rgba16float")
    expect(storage(second.group!, 4).descriptor!.usage & GPUTextureUsage.STORAGE_BINDING).toBeGreaterThan(0)
    expect(first.scissor).toEqual([0, 0, 64, 32])
    expect(second.scissor).toEqual([0, 0, 32, 16])
    filter.dispose()
    expect(f.textures.every(texture => texture.destroys === 1)).toBeTrue()
    expect(f.buffers.every(buffer => buffer.destroys === 1)).toBeTrue()
  } finally {
    filter.dispose()
    restore()
  }
})
