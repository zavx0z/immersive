import {expect, test} from "bun:test"
import {BufferGeometry, Color, GlassMaterial, HolographicMaterial, InstancedMesh, LineBasicMaterial, LineGlowMaterial, LineSegments, Mesh, MeshBasicMaterial, Object3D, WireframeInstancedMesh} from "@zavx0z/immersive-engine"
import {Renderer} from "../src/renderer/index"
import {classifyRenderItems, type RenderItem} from "../src/renderer/utils/render-list"
import {createGlassTargets, glassTargetBytes, type GlassTargets} from "../src/renderer/glass-targets"
import type {RenderCommandEncoder} from "../src/renderer/render-bundle-cache"
import type {RendererWebGpuDisplayPlane} from "../src/display-plane"

type Texture = GPUTexture & {label: string, destroys: number}
type Prepared = {root: Object3D, layer: ReturnType<typeof classifyRenderItems>, resources: {globalBindGroup: GPUBindGroup}, viewport: {x: number, y: number, width: number, height: number}, paintBackground: boolean}
type State = {
  device: GPUDevice
  canvas: {width: number, height: number}
  presentationFormat: GPUTextureFormat
  depthTexture: GPUTexture
  depthTextureView: GPUTextureView
  multisampleTextureView: GPUTextureView
  glassCompositeLayout: GPUBindGroupLayout
  glassDepthLayout: GPUBindGroupLayout
  glassCompositePipeline: GPURenderPipeline
  glassTargets: GlassTargets | null
  displayRasterTargets: Map<RendererWebGpuDisplayPlane, {width: number, height: number, depth: GPUTexture, multisample: GPUTexture, texture: GPUTexture, glassTargets?: GlassTargets}>
  renderPreparedLayer(command: GPUCommandEncoder, view: GPUTextureView, prepared: Prepared, indices: ReadonlyMap<RenderItem, number>, clear: boolean, color?: GPUColor, raster?: State["displayRasterTargets"] extends Map<unknown, infer T> ? T : never): void
  renderObjectList(encoder: RenderCommandEncoder, items: RenderItem[], indices: ReadonlyMap<RenderItem, number>, ui?: boolean, sceneLinePhase?: "depth" | "color"): void
  updateTextures(): void
}

function usage() {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "GPUTextureUsage")
  Object.defineProperty(globalThis, "GPUTextureUsage", {configurable: true, value: {RENDER_ATTACHMENT: 1, TEXTURE_BINDING: 2, COPY_SRC: 4, COPY_DST: 8}})
  return () => { if (previous) Object.defineProperty(globalThis, "GPUTextureUsage", previous); else Reflect.deleteProperty(globalThis, "GPUTextureUsage") }
}

function fixture() {
  const descriptors: GPUTextureDescriptor[] = []
  const textures: Texture[] = []
  const bundles: GPURenderBundleEncoderDescriptor[] = []
  const passes: GPURenderPassDescriptor[] = []
  const draws: string[][] = []
  const linePhases: {items: string[], phase: "depth" | "color" | null, ui: boolean, pass: number}[] = []
  const makeTexture = (descriptor: GPUTextureDescriptor): Texture => {
    const size = descriptor.size as GPUExtent3DDict
    const [width, height] = Array.isArray(descriptor.size) ? descriptor.size : [size.width, size.height]
    const texture = {label: descriptor.label, width, height, destroys: 0,
      createView(descriptor?: GPUTextureViewDescriptor) {return {texture, descriptor}}, destroy() {texture.destroys++}} as unknown as Texture
    descriptors.push(descriptor)
    textures.push(texture)
    return texture
  }
  const commands = () => ({setPipeline() {}, setBindGroup() {}, setVertexBuffer() {}, setIndexBuffer() {}, draw() {}, drawIndexed() {}})
  const device = {limits: {maxTextureDimension2D: 8192},
    createTexture: makeTexture, createBindGroup: (descriptor: GPUBindGroupDescriptor) => ({descriptor}),
    createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor) {bundles.push(descriptor); return {...commands(), finish: () => ({})}},
  } as unknown as GPUDevice
  const renderer = new Renderer()
  const state = renderer as unknown as State
  state.device = device
  state.canvas = {width: 2730, height: 2176}
  state.presentationFormat = "bgra8unorm"
  state.glassCompositeLayout = {} as GPUBindGroupLayout
  state.glassDepthLayout = {} as GPUBindGroupLayout
  state.glassCompositePipeline = {} as GPURenderPipeline
  state.updateTextures()
  let current = -1
  const command = {beginRenderPass(descriptor: GPURenderPassDescriptor) {
    current = passes.length
    passes.push(descriptor)
    draws.push([])
    return {...commands(), setViewport() {}, setScissorRect() {}, setStencilReference() {}, executeBundles() {}, end() {}}
  }} as unknown as GPUCommandEncoder
  state.renderObjectList = (_encoder, items, _indices, ui = false, phase) => {
    const names = items.map(item => item.object.name)
    draws[current]!.push(...names)
    if (names.length) linePhases.push({items: names, phase: phase ?? null, ui, pass: current})
  }
  const view = {} as GPUTextureView
  return {renderer, state, device, command, view, descriptors, textures, passes, draws, bundles, linePhases}
}

function item(name: string, material: GlassMaterial | MeshBasicMaterial | HolographicMaterial): RenderItem {
  const object = new Mesh(new BufferGeometry(), material)
  object.name = name
  return {type: "static-mesh", object, worldMatrix: object.matrixWorld}
}

function prepared(items: RenderItem[]): Prepared {
  return {root: new Object3D(), layer: classifyRenderItems(items), resources: {globalBindGroup: {} as GPUBindGroup}, viewport: {x: 0, y: 0, width: 2730, height: 2176}, paintBackground: false}
}

for (const withGlass of [false, true]) test(`scene LineGlow depth/color остаются в World pass, соседние paths сохраняются (${withGlass ? "glass" : "plain"})`, () => {
  const restore = usage(), f = fixture()
  try {
    const line = (name: string, material: LineBasicMaterial): RenderItem => {
      const object = new LineSegments(new BufferGeometry(), material)
      object.name = name
      return {type: "line", object, worldMatrix: object.matrixWorld}
    }
    const near = line("near", new LineGlowMaterial({visibilityMode: "scene", opacity: .65, distanceFade: 0}))
    const far = line("far", new LineGlowMaterial({visibilityMode: "scene", opacity: .65}))
    const basic = line("basic", new LineBasicMaterial())
    const silhouette = line("silhouette", new LineGlowMaterial({visibilityMode: "silhouette"}))
    const ui = line("ui", new LineGlowMaterial({visibilityMode: "scene"}))
    ui.object.renderLayer = "ui"
    const instancedObject = new WireframeInstancedMesh(new BufferGeometry(), new LineGlowMaterial({visibilityMode: "scene"}), 1)
    instancedObject.name = "instanced"
    const instanced: RenderItem = {type: "instanced-line", object: instancedObject, worldMatrix: instancedObject.matrixWorld}
    const scene = prepared([near, basic, item("opaque", new MeshBasicMaterial()), far, instanced, silhouette, ui,
      ...(withGlass ? [item("glass", new GlassMaterial()), item("hologram", new HolographicMaterial())] : [])])
    f.state.renderPreparedLayer(f.command, f.view, scene, new Map(), true)
    expect(f.passes).toHaveLength(withGlass ? 4 : 1)
    expect(f.linePhases.filter(call => call.phase !== null)).toEqual([
      {items: ["near", "far"], phase: "depth", ui: false, pass: 0},
      {items: ["near", "far"], phase: "color", ui: false, pass: 0},
    ])
    expect(f.linePhases[0]!.items).toEqual(withGlass ? ["basic", "opaque", "instanced"] : ["silhouette", "basic", "opaque", "instanced"])
    expect(f.linePhases.at(-1)).toEqual({items: ["ui"], phase: null, ui: true, pass: withGlass ? 3 : 0})
    if (withGlass) {
      expect(f.draws[0]).toEqual(["basic", "opaque", "instanced", "hologram", "near", "far", "near", "far"])
      expect(f.draws[1]).toEqual(["glass"])
      expect(f.draws[3]).toEqual(["silhouette", "ui"])
    }
  } finally {f.renderer.dispose(); restore()}
})

test("неподдерживаемый вид стеклянного меша отклоняется до GPU encoding", () => {
  const mesh = new InstancedMesh(new BufferGeometry(), new GlassMaterial(), 1)
  expect(() => classifyRenderItems([{type: "instanced-mesh", object: mesh, worldMatrix: mesh.matrixWorld}])).toThrow("GlassMaterial поддерживает static-mesh")
  const skinned = item("unsupported", new GlassMaterial())
  expect(() => classifyRenderItems([{...skinned, type: "skinned-mesh"}])).toThrow("GlassMaterial поддерживает static-mesh")
})

test("opaque depth разрешается до OIT; стекло рисуется один раз перед контурами/HUD", () => {
  const restore = usage()
  const f = fixture()
  try {
    const glass = item("glass", new GlassMaterial({tintColor: new Color(.3, .6, .9, .2)}))
    glass.object.renderLayer = "ui"
    const hud = item("hud", new MeshBasicMaterial())
    hud.object.renderLayer = "ui"
    const lineObject = new LineSegments(new BufferGeometry(), new LineGlowMaterial({visibilityMode: "silhouette"}))
    lineObject.name = "outline"
    const line: RenderItem = {type: "line", object: lineObject, worldMatrix: lineObject.matrixWorld}
    const scene = prepared([item("opaque", new MeshBasicMaterial()), glass, line, item("hologram", new HolographicMaterial()), hud])
    f.state.renderPreparedLayer(f.command, f.view, scene, new Map(), true)
    expect(f.passes).toHaveLength(4)
    expect(f.draws).toEqual([["opaque", "hologram"], ["glass"], [], ["outline", "hud"]])
    expect(f.passes[0]!.depthStencilAttachment!.depthLoadOp).toBe("clear")
    expect(f.passes[1]!.depthStencilAttachment).toBeUndefined()
    expect(Array.from(f.passes[1]!.colorAttachments)).toHaveLength(2)
    expect(Array.from(f.passes[1]!.colorAttachments).every(attachment => attachment!.loadOp === "clear")).toBeTrue()
    expect(Array.from(f.passes[0]!.colorAttachments)[0]!.resolveTarget).toBe(f.state.glassTargets!.opaqueView)
    for (const pass of f.passes.slice(2)) {
      const attachment = Array.from(pass.colorAttachments)[0]!
      expect(attachment.view).toBe(f.state.multisampleTextureView)
      expect(attachment.resolveTarget).toBe(f.view)
      expect(attachment.loadOp).toBe("load")
      expect(pass.depthStencilAttachment!.depthLoadOp).toBe("load")
    }
    const depth = f.descriptors.find(descriptor => descriptor.format === "depth24plus-stencil8")!
    expect(Number(depth.usage) & GPUTextureUsage.TEXTURE_BINDING).not.toBe(0)
    expect(depth.sampleCount).toBe(4)
    f.state.renderPreparedLayer(f.command, f.view, scene, new Map(), false)
    expect(f.descriptors.filter(descriptor => String(descriptor.label).startsWith("glass-"))).toHaveLength(3)
    expect(f.bundles.find(descriptor => descriptor.sampleCount === 1)).toMatchObject({colorFormats: ["rgba16float", "rgba16float"]})
    expect(f.bundles.find(descriptor => descriptor.sampleCount === 1)).not.toHaveProperty("depthStencilFormat")
  } finally {f.renderer.dispose(); restore()}
})

test("нет стекла — нет новых targets/проходов; resize и повторный dispose освобождают каждый target ровно раз", () => {
  const restore = usage()
  const f = fixture()
  try {
    f.state.renderPreparedLayer(f.command, f.view, prepared([item("opaque", new MeshBasicMaterial())]), new Map(), true)
    expect(f.passes).toHaveLength(1)
    expect(f.state.glassTargets).toBeNull()
    expect(f.descriptors.filter(descriptor => String(descriptor.label).startsWith("glass-"))).toEqual([])
    const scene = prepared([item("glass", new GlassMaterial())])
    f.state.renderPreparedLayer(f.command, f.view, scene, new Map(), true)
    const before = f.state.glassTargets!.textures as Texture[]
    expect(glassTargetBytes(2730, 2176)).toBe(118809600)
    expect(before.map(texture => texture.destroys)).toEqual([0, 0, 0])
    f.state.canvas.width = 1400
    f.state.updateTextures()
    expect(before.map(texture => texture.destroys)).toEqual([1, 1, 1])
    f.state.renderPreparedLayer(f.command, f.view, scene, new Map(), true)
    expect(f.state.glassTargets!.width).toBe(1400)
    f.renderer.dispose()
    f.renderer.dispose()
    expect(f.textures.every(texture => texture.destroys === 1)).toBeTrue()
  } finally {f.renderer.dispose(); restore()}
})

test("partial allocation clean-up не оставляет textures; targets используют фактический размер Display", () => {
  const restore = usage()
  const f = fixture()
  try {
    const texture = (label: string, format: GPUTextureFormat, sampleCount = 1) => f.device.createTexture({label, format, size: [3000, 2400], sampleCount, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING})
    const target = {width: 3000, height: 2400, depth: texture("raster-depth", "depth24plus-stencil8", 4), multisample: texture("raster-msaa", "bgra8unorm", 4), texture: texture("raster", "bgra8unorm")}
    const plane = {rasterSurface: null} as unknown as RendererWebGpuDisplayPlane
    f.state.displayRasterTargets.set(plane, target)
    f.state.renderPreparedLayer(f.command, f.view, prepared([item("glass", new GlassMaterial())]), new Map(), true, undefined, target)
    const raster = target as typeof target & {glassTargets: GlassTargets}
    expect(raster.glassTargets).toMatchObject({width: 3000, height: 2400})
    expect(f.state.glassTargets).toBeNull()
    f.renderer.releaseDisplay(plane)
    expect((raster.glassTargets.textures as Texture[]).every(texture => texture.destroys === 1)).toBeTrue()
    let allocations = 0
    const base = f.device.createTexture.bind(f.device)
    const failing = {limits: f.device.limits, createTexture(descriptor: GPUTextureDescriptor) {
      if (++allocations === 2) throw new Error("allocation refused")
      return base(descriptor)
    }} as unknown as GPUDevice
    expect(() => createGlassTargets(failing, 20, 20, "bgra8unorm", {} as GPUBindGroupLayout, {} as GPUBindGroupLayout, {} as GPUTextureView)).toThrow("allocation refused")
    expect(f.textures.at(-1)!.destroys).toBe(1)
  } finally {f.renderer.dispose(); restore()}
})
