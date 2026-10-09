import {expect, spyOn, test} from "bun:test"
import {BufferAttribute, BufferGeometry, Matrix4, Mesh, MeshBasicMaterial, Object3D, Skeleton, SkinnedMesh, Text} from "@zavx0z/immersive-engine"
import {Renderer} from "../src/renderer/index.ts"
import {BONE_MATRICES_SIZE, PER_OBJECT_UNIFORM_SIZE, type PerObjectUploadPlan} from "../src/renderer/per-object-upload.ts"
import {RenderBundleCache} from "../src/renderer/render-bundle-cache.ts"
import type {RenderItem} from "../src/renderer/utils/render-list.ts"

type Resource = {size: number, destroys: number, destroy(): void}
type Internals = {
  device: GPUDevice | null
  ownedDevice: GPUDevice | null
  context: GPUCanvasContext | null
  canvas: {width: number, height: number}
  presentationFormat: GPUTextureFormat
  updateTextures(): void
  perObjectBindGroupLayout: GPUBindGroupLayout
  perObjectBindGroup: GPUBindGroup | null
  perObjectCapacity: number
  boneMatricesCapacity: number
  perObjectDataCPU: Float32Array
  boneMatricesDataCPU: Float32Array
  boneDynamicOffsets: Uint32Array
  renderBundleCaches: Map<Object3D, RenderBundleCache>
  geometryCache: Map<BufferGeometry, {positionBuffer: GPUBuffer}>
  depthTexture: GPUTexture | null
  multisampleTexture: GPUTexture | null
  presentedFrameTexture: GPUTexture | null
  createPerObjectResources(capacity: number): void
  ensurePerObjectCapacity(required: number, skinned: number): void
  getOrCreateGeometryBuffers(geometry: BufferGeometry): {positionBuffer: GPUBuffer}
  renderMesh(encoder: import("../src/renderer/render-bundle-cache.ts").RenderCommandEncoder, mesh: Mesh | SkinnedMesh, matrix: Matrix4, index: number): void
  updatePerObjectData(items: RenderItem[]): PerObjectUploadPlan
}

function fixture() {
  // Дескрипторы и lifecycle production Renderer проверяются без native GPU.
  const resources: Resource[] = []
  const groups: GPUBindGroupDescriptor[] = []
  const textures: {width: number, height: number | undefined, destroys: number}[] = []
  const textureDescriptors: GPUTextureDescriptor[] = []
  let deviceDestroys = 0
  const device = {
    limits: {maxStorageBufferBindingSize: 1 << 20, maxBufferSize: 1 << 20},
    createBuffer({size}: GPUBufferDescriptor) {
      const resource: Resource = {size, destroys: 0, destroy() {this.destroys++}}
      resources.push(resource)
      return resource
    },
    createTexture(descriptor: GPUTextureDescriptor) {
      const size = descriptor.size as GPUExtent3DDict
      const texture = {width: size.width, height: size.height, destroys: 0, createView: () => ({}), destroy() {this.destroys++}}
      textures.push(texture)
      textureDescriptors.push(descriptor)
      return texture
    },
    createBindGroup(descriptor: GPUBindGroupDescriptor) {groups.push(descriptor); return {descriptor}},
    destroy() {deviceDestroys++},
  } as unknown as GPUDevice
  const renderer = new Renderer()
  const state = renderer as unknown as Internals
  state.device = device
  state.perObjectBindGroupLayout = {} as GPUBindGroupLayout
  return {renderer, state, device, groups, resources, textures, textureDescriptors, deviceDestroys: () => deviceDestroys}
}

function usageGlobals() {
  const keys = ["GPUBufferUsage", "GPUTextureUsage"] as const
  const previous = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key))
  Object.defineProperty(globalThis, keys[0], {configurable: true, value: {UNIFORM: 1, COPY_DST: 2, STORAGE: 4}})
  Object.defineProperty(globalThis, keys[1], {configurable: true, value: {RENDER_ATTACHMENT: 1, TEXTURE_BINDING: 2, COPY_SRC: 4}})
  return () => keys.forEach((key, index) => {
    const descriptor = previous[index]
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else Reflect.deleteProperty(globalThis, key)
  })
}

function meshItem(skinned: boolean, x = 0): RenderItem {
  const geometry = new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(9), 3))
  const material = new MeshBasicMaterial()
  const bone = new Object3D()
  bone.position.x = x
  bone.updateWorldMatrix()
  const object = skinned ? new SkinnedMesh(geometry, material, new Skeleton([bone], [new Matrix4()])) : new Mesh(geometry, material)
  object.updateWorldMatrix()
  return skinned ? {type: "skinned-mesh", object: object as SkinnedMesh, worldMatrix: object.matrixWorld}
    : {type: "static-mesh", object: object as Mesh, worldMatrix: object.matrixWorld}
}

test("обычная сцена имеет нулевой CPU bones и один валидный GPU binding независимо от числа draws", () => {
  const restore = usageGlobals()
  const f = fixture()
  try {
    f.state.createPerObjectResources(512)
    f.state.ensurePerObjectCapacity(2048, 0)
    expect(f.state.perObjectDataCPU.byteLength).toBe(2048 * PER_OBJECT_UNIFORM_SIZE)
    expect(f.state.boneMatricesDataCPU.byteLength).toBe(0)
    expect(f.state.boneMatricesCapacity).toBe(0)
    const group = f.groups.at(-1)!
    const binding = Array.from(group.entries).find(entry => entry.binding === 1)!.resource as GPUBufferBinding
    expect(binding.size).toBe(BONE_MATRICES_SIZE)
    expect((binding.buffer as unknown as Resource).size).toBe(BONE_MATRICES_SIZE)
    expect(f.state.updatePerObjectData([meshItem(false)]).boneRanges).toEqual([])
    expect(f.state.boneDynamicOffsets[0]).toBe(0)
  } finally {f.renderer.dispose(); restore()}
})

test("static и skin разделяют offset0; остальные skin компактны и анимация обновляет их полные blocks", () => {
  const restore = usageGlobals()
  const f = fixture()
  try {
    const first = meshItem(true, 7)
    const second = meshItem(true, 19)
    const items = [meshItem(false), first, meshItem(false), second]
    f.state.createPerObjectResources(512)
    f.state.ensurePerObjectCapacity(items.length, 2)
    const group = f.state.perObjectBindGroup
    expect(f.state.updatePerObjectData(items)).toEqual({uniformBytes: 4 * PER_OBJECT_UNIFORM_SIZE, boneRanges: [{byteOffset: 0, byteLength: 2 * BONE_MATRICES_SIZE}]})
    expect([...f.state.boneDynamicOffsets.slice(0, 4)]).toEqual([0, 0, 0, BONE_MATRICES_SIZE])
    expect(f.state.boneMatricesDataCPU[12]).toBe(7)
    expect(f.state.boneMatricesDataCPU[BONE_MATRICES_SIZE / 4 + 12]).toBe(19)
    const bone = (first.object as SkinnedMesh).skeleton.bones[0]!
    bone.position.x = 31
    bone.updateWorldMatrix()
    f.state.updatePerObjectData([second, meshItem(false), first, meshItem(false)])
    expect(f.state.perObjectBindGroup).toBe(group)
    expect([...f.state.boneDynamicOffsets.slice(0, 4)]).toEqual([0, 0, BONE_MATRICES_SIZE, 0])
    expect(f.state.boneMatricesDataCPU[12]).toBe(19)
    expect(f.state.boneMatricesDataCPU[BONE_MATRICES_SIZE / 4 + 12]).toBe(31)
    expect(f.state.boneMatricesDataCPU.slice(16, BONE_MATRICES_SIZE / 4).every(value => value === 0)).toBe(true)
  } finally {f.renderer.dispose(); restore()}
})

test("idle trim освобождает большие буферы и bundles, следующий draw получает действующие offsets", async () => {
  const restore = usageGlobals()
  const f = fixture()
  try {
    f.state.createPerObjectResources(512)
    f.state.ensurePerObjectCapacity(2048, 32)
    const oldResources = [...f.resources]
    const cache = new RenderBundleCache()
    const cleared = spyOn(cache, "clear")
    f.state.renderBundleCaches.set(new Object3D(), cache)
    f.state.ensurePerObjectCapacity(4, 2)
    await new Promise(resolve => setTimeout(resolve, 1100))
    expect(f.state.perObjectCapacity).toBe(512)
    expect(f.state.boneMatricesCapacity).toBe(2)
    expect(cleared).toHaveBeenCalledTimes(1)
    expect(f.state.renderBundleCaches.size).toBe(0)
    expect(oldResources.filter(resource => resource.size === 2048 * 256 || resource.size === 32 * 8192).map(resource => resource.destroys)).toEqual([1, 1])
    const items = [meshItem(false), meshItem(true, 3), meshItem(true, 4)]
    f.state.updatePerObjectData(items)
    expect([...f.state.boneDynamicOffsets.slice(0, 3)]).toEqual([0, 0, 8192])
    expect(f.state.boneMatricesDataCPU[2048 + 12]).toBe(4)
    const allocatedBindGroup = f.state.perObjectBindGroup
    expect(allocatedBindGroup).not.toBeNull()
    if (allocatedBindGroup === null) throw new Error("Expected allocated per-object bind group after trim")
    const offsets: number[][] = []
    let draws = 0
    f.state.getOrCreateGeometryBuffers = () => ({positionBuffer: {} as GPUBuffer})
    const encoder = {
      setBindGroup(_index: number, group: GPUBindGroup, values: Iterable<number> = []) {
        expect(group).toBe(allocatedBindGroup)
        offsets.push([...values])
      },
      setPipeline() {}, setVertexBuffer() {}, setIndexBuffer() {}, drawIndexed() {}, draw() {draws++},
    }
    items.forEach((item, index) => f.state.renderMesh(encoder, item.object as Mesh, item.worldMatrix, index))
    expect(offsets).toEqual([[0, 0], [256, 0], [512, 8192]])
    expect(draws).toBe(3)
    f.state.ensurePerObjectCapacity(3, 0)
    expect(f.state.boneMatricesDataCPU.byteLength).toBe(0)
    f.renderer.dispose()
    f.renderer.dispose()
    expect(f.resources.every(resource => resource.destroys === 1)).toBe(true)
  } finally {f.renderer.dispose(); restore()}
})

test("eviction освобождает только geometry своего Renderer; final dispose снимает подписку и не разрушает borrowed device", () => {
  let callback: ((geometry: BufferGeometry) => void) | undefined
  let unsubscribed = 0
  const subscription = spyOn(Text, "onLayoutEvicted").mockImplementation(listener => {
    callback = listener
    return () => {unsubscribed++}
  })
  const f = fixture()
  const geometry = new BufferGeometry()
  const buffer: Resource = {size: 16, destroys: 0, destroy() {this.destroys++}}
  f.state.geometryCache.set(geometry, {positionBuffer: buffer as unknown as GPUBuffer})
  try {
    callback!(geometry)
    callback!(geometry)
    expect(buffer.destroys).toBe(1)
    expect(f.state.geometryCache.size).toBe(0)
    f.renderer.dispose()
    f.renderer.dispose()
    expect(unsubscribed).toBe(1)
    expect(f.deviceDestroys()).toBe(0)
  } finally {f.renderer.dispose(); subscription.mockRestore()}
})

test("final dispose уничтожает attachments и owned device ровно раз, сохраняет чужую canvas configuration", () => {
  const f = fixture()
  const texture = {destroys: 0, destroy() {this.destroys++}}
  let unconfigured = 0
  f.state.depthTexture = texture as unknown as GPUTexture
  f.state.multisampleTexture = texture as unknown as GPUTexture
  f.state.presentedFrameTexture = texture as unknown as GPUTexture
  f.state.ownedDevice = f.device
  f.state.context = {getConfiguration: () => ({device: {} as GPUDevice}), unconfigure() {unconfigured++}} as unknown as GPUCanvasContext
  f.renderer.dispose()
  f.renderer.dispose()
  expect(texture.destroys).toBe(1)
  expect(f.deviceDestroys()).toBe(1)
  expect(unconfigured).toBe(0)
})

for (const failure of ["missing context", "configure throws"] as const) {
  test(`init ${failure} освобождает уже полученное устройство`, async () => {
    const restoreUsage = usageGlobals()
    const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")
    const f = fixture()
    let unconfigured = 0
    const context = {configure() {throw new Error("configure throws")}, unconfigure() {unconfigured++}}
    Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu: {
      requestAdapter: async () => ({features: new Set(), requestDevice: async () => f.device}), getPreferredCanvasFormat: () => "bgra8unorm",
    }}})
    try {
      await expect(f.renderer.init({getContext: () => failure === "missing context" ? null : context} as unknown as HTMLCanvasElement)).rejects.toThrow(failure === "missing context" ? "WebGPU контекст" : "configure throws")
      expect(f.deviceDestroys()).toBe(1)
      expect(unconfigured).toBe(0)
      f.renderer.dispose()
      expect(f.deviceDestroys()).toBe(1)
    } finally {
      f.renderer.dispose()
      restoreUsage()
      if (oldNavigator) Object.defineProperty(globalThis, "navigator", oldNavigator)
      else Reflect.deleteProperty(globalThis, "navigator")
    }
  })
}


test("resize заменяет attachments только при новом размере, final dispose освобождает оставшиеся без изменения MSAA/capture", () => {
  const restore = usageGlobals()
  const f = fixture()
  try {
    f.state.canvas = {width: 320, height: 180}
    f.state.presentationFormat = "bgra8unorm"
    f.state.updateTextures()
    expect(f.textures).toHaveLength(3)
    expect(f.textureDescriptors.map(value => value.sampleCount ?? 1)).toEqual([4, 4, 1])
    expect(f.textureDescriptors.map(value => value.format)).toEqual(["depth24plus-stencil8", "bgra8unorm", "bgra8unorm"])
    f.state.updateTextures()
    expect(f.textures).toHaveLength(3)
    expect(f.textures.every(texture => texture.destroys === 0)).toBe(true)
    f.state.canvas.width = 640
    f.state.updateTextures()
    expect(f.textures).toHaveLength(6)
    expect(f.textures.slice(0, 3).map(texture => texture.destroys)).toEqual([1, 1, 1])
    expect(f.textures.slice(3).map(texture => texture.destroys)).toEqual([0, 0, 0])
    f.renderer.dispose()
    f.renderer.dispose()
    expect(f.textures.map(texture => texture.destroys)).toEqual([1, 1, 1, 1, 1, 1])
  } finally {f.renderer.dispose(); restore()}
})

test("device request завершившийся после init timeout уничтожается и никогда не публикуется", async () => {
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  const f = fixture()
  let resolveDevice: ((device: GPUDevice) => void) | undefined
  const request = new Promise<GPUDevice>(resolve => {resolveDevice = resolve})
  const timeouts: (() => void)[] = []
  const nativeSetTimeout = globalThis.setTimeout
  function controlledSetTimeout(handler: TimerHandler, timeout?: number, ...args: any[]): number
  function controlledSetTimeout(callback: (...args: any[]) => void, delay?: number, ...args: any[]): ReturnType<typeof setTimeout>
  function controlledSetTimeout(callback: TimerHandler, delay?: number, ...args: any[]): number | ReturnType<typeof setTimeout> {
    if (delay !== 15000) return nativeSetTimeout(callback, delay, ...args)
    if (typeof callback !== "function") throw new Error("Expected timeout function")
    timeouts.push(callback as () => void)
    return {unref() {}} as ReturnType<typeof setTimeout>
  }
  const timeout = spyOn(globalThis, "setTimeout").mockImplementation(Object.assign(controlledSetTimeout, {
    __promisify__: nativeSetTimeout.__promisify__,
  }))
  const clear = spyOn(globalThis, "clearTimeout").mockImplementation(() => {})
  Object.defineProperty(globalThis, "navigator", {configurable: true, value: {gpu: {
    requestAdapter: async () => ({features: new Set(), requestDevice: () => request}),
  }}})
  try {
    const init = f.renderer.init({} as HTMLCanvasElement)
    const rejected = init.then(() => {throw new Error("Expected init failure")}, error => error)
    for (let turn = 0; turn < 20; turn++) await Promise.resolve()
    expect(timeouts).toHaveLength(2)
    timeouts[1]!()
    expect((await rejected).message).toContain("WebGPU device init timed out")
    expect(f.deviceDestroys()).toBe(0)
    expect(f.state.device).toBeNull()
    resolveDevice!(f.device)
    await Promise.resolve()
    expect(f.deviceDestroys()).toBe(1)
    expect(f.state.ownedDevice).toBeNull()
    f.renderer.dispose()
    expect(f.deviceDestroys()).toBe(1)
  } finally {
    f.renderer.dispose()
    timeout.mockRestore()
    clear.mockRestore()
    if (oldNavigator) Object.defineProperty(globalThis, "navigator", oldNavigator)
    else Reflect.deleteProperty(globalThis, "navigator")
  }
})
