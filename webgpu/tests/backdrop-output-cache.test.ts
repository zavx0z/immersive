import {expect, test} from "bun:test"
import {BackdropOutputCache} from "../src/renderer/backdrop-output-cache.ts"

type Texture = GPUTexture & {
  destroys: number
  descriptor: GPUTextureDescriptor
}
type Group = GPUBindGroup & {descriptor: GPUBindGroupDescriptor}

function fixture(maxBytes = 1024) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "GPUTextureUsage")
  Object.defineProperty(globalThis, "GPUTextureUsage", {configurable: true, value: {TEXTURE_BINDING: 4, RENDER_ATTACHMENT: 16}})
  const textures: Texture[] = [], groups: Group[] = []
  let failure: "texture" | "view" | "group" | undefined
  const device = {
    createTexture(descriptor: GPUTextureDescriptor) {
      if (failure === "texture") throw new Error("texture allocation failed")
      const texture = {descriptor, destroys: 0, createView() {
        if (failure === "view") throw new Error("view allocation failed")
        expect(texture.destroys).toBe(0)
        return {texture}
      }, destroy() {texture.destroys++}} as unknown as Texture
      textures.push(texture)
      return texture
    },
    createBindGroup(descriptor: GPUBindGroupDescriptor) {
      if (failure === "group") throw new Error("group allocation failed")
      const group = {descriptor} as Group
      groups.push(group)
      return group
    },
  } as unknown as GPUDevice
  const borrowed = () => ({destroys: 0, destroy() {this.destroys++}})
  const sampler = borrowed(), uniform = borrowed(), layout = {}
  const cache = new BackdropOutputCache(device, "bgra8unorm", layout as GPUBindGroupLayout, sampler as unknown as GPUSampler, maxBytes)
  return {cache, textures, groups, device, sampler, uniform, layout,
    fail(value?: typeof failure) {failure = value},
    acquire(operation: object, target: object, width = 4, height = 4, reusable = true, info: GPUBuffer = uniform as unknown as GPUBuffer) {
      return cache.acquire(operation, target, info, width, height, reusable)
    },
    close() {
      cache.dispose()
      if (previous) Object.defineProperty(globalThis, "GPUTextureUsage", previous)
      else Reflect.deleteProperty(globalThis, "GPUTextureUsage")
    },
  }
}

test("output becomes a hit only after submission confirmation and binds borrowed composite resources", () => {
  const f = fixture(), operation = {}, target = {}
  try {
    f.cache.beginFrame()
    const first = f.acquire(operation, target)!
    expect(first.hit).toBe(false)
    expect(f.acquire(operation, target)!.hit).toBe(false)
    const group = first.group as Group
    expect(group.descriptor.layout).toBe(f.layout as GPUBindGroupLayout)
    const entries = Array.from(group.descriptor.entries)
    expect((entries[0]!.resource as GPUTextureView & {texture: Texture}).texture).toBe(first.texture as Texture)
    expect(entries[1]!.resource).toBe(f.sampler as unknown as GPUSampler)
    expect((entries[2]!.resource as GPUBufferBinding).buffer).toBe(f.uniform as unknown as GPUBuffer)
    expect(f.textures[0]!.descriptor.usage).toBe(GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT)
    f.cache.endFrame()
    f.cache.beginFrame()
    expect(f.acquire(operation, target)).toEqual({...first, hit: true})
    f.cache.endFrame()
    expect(f.textures).toHaveLength(1)
    f.cache.dispose()
    f.cache.dispose()
    expect(f.textures[0]!.destroys).toBe(1)
    expect([f.uniform.destroys, f.sampler.destroys]).toEqual([0, 0])
  } finally {f.close()}
})

test("aborted frames never validate pending outputs, including overwritten formerly valid output", () => {
  const f = fixture(), operation = {}, target = {}
  try {
    f.cache.beginFrame()
    const first = f.acquire(operation, target)!
    f.cache.beginFrame()
    expect(f.acquire(operation, target)!.hit).toBe(false)
    f.cache.endFrame()
    f.cache.beginFrame()
    expect(f.acquire(operation, target)!.hit).toBe(true)
    expect(f.acquire(operation, target, 4, 4, false)!.hit).toBe(false)
    f.cache.beginFrame()
    expect(f.acquire(operation, target)!.hit).toBe(false)
    expect(f.acquire(operation, target)!.texture).toBe(first.texture)
    f.cache.endFrame()
  } finally {f.close()}
})

test("operation and target identity isolate outputs; endFrame prunes only unseen entries", () => {
  const f = fixture(), operation = {}, other = {}, target = {}, secondTarget = {}
  try {
    f.cache.beginFrame()
    const a = f.acquire(operation, target)!, b = f.acquire(other, target)!, c = f.acquire(operation, secondTarget)!
    expect(new Set([a.texture, b.texture, c.texture]).size).toBe(3)
    f.cache.endFrame()
    f.cache.beginFrame()
    expect(f.acquire(operation, target)!.hit).toBe(true)
    expect((b.texture as Texture).destroys).toBe(0)
    f.cache.endFrame()
    expect(f.textures.map(texture => texture.destroys)).toEqual([0, 1, 1])
    f.cache.releaseTarget(target)
    f.cache.releaseTarget(target)
    expect(f.textures.map(texture => texture.destroys)).toEqual([1, 1, 1])
  } finally {f.close()}
})

test("budget fallback never evicts current-frame outputs and releases exact capacity", () => {
  const f = fixture(128), operation = {}, other = {}, target = {}
  try {
    f.cache.beginFrame()
    const a = f.acquire(operation, target)!, b = f.acquire(other, target)!
    expect(f.acquire({}, target)).toBeNull()
    expect((a.texture as Texture).destroys + (b.texture as Texture).destroys).toBe(0)
    expect(f.acquire(operation, target)!.texture).toBe(a.texture)
    expect(() => f.cache.releaseTarget(target)).toThrow("unsubmitted")
    expect(f.textures.every(texture => texture.destroys === 0)).toBe(true)
    f.cache.endFrame()
    f.cache.releaseTarget(target)
    f.cache.beginFrame()
    expect(f.acquire({}, target, 8, 4)).not.toBeNull()
    expect(f.acquire({}, target, 1, 1)).toBeNull()
    f.cache.endFrame()
  } finally {f.close()}
})

test("resize is transactional and cannot replace a texture already used by the active frame", () => {
  const f = fixture(208), operation = {}, target = {}
  try {
    f.cache.beginFrame()
    const first = f.acquire(operation, target)!
    expect(() => f.acquire(operation, target, 6, 6)).toThrow("current frame")
    expect((first.texture as Texture).destroys).toBe(0)
    expect(f.textures).toHaveLength(1)
    f.cache.endFrame()
    f.cache.beginFrame()
    const resized = f.acquire(operation, target, 6, 6)!
    expect(resized.hit).toBe(false)
    expect(resized.texture).not.toBe(first.texture)
    expect((first.texture as Texture).destroys).toBe(1)
    expect(f.acquire({}, target)).not.toBeNull()
    f.cache.endFrame()
  } finally {f.close()}
})

test("resize fallback accounts for replacement peak instead of destroying the valid baseline", () => {
  const f = fixture(144), operation = {}, target = {}
  try {
    f.cache.beginFrame()
    const first = f.acquire(operation, target)!
    f.cache.endFrame()
    f.cache.beginFrame()
    expect(f.acquire(operation, target, 6, 6)).toBeNull()
    expect((first.texture as Texture).destroys).toBe(0)
    expect(f.acquire(operation, target)!.hit).toBe(true)
    f.cache.endFrame()
  } finally {f.close()}
})

test("changed size uniform rebinds without texture allocation and invalidates the cached result", () => {
  const f = fixture(), operation = {}, target = {}, uniform = {} as GPUBuffer
  try {
    f.cache.beginFrame()
    const first = f.acquire(operation, target)!
    f.cache.endFrame()
    f.cache.beginFrame()
    const rebound = f.acquire(operation, target, 4, 4, true, uniform)!
    expect(rebound.texture).toBe(first.texture)
    expect(rebound.group).not.toBe(first.group)
    expect(rebound.hit).toBe(false)
    expect(f.textures).toHaveLength(1)
    expect(() => f.acquire(operation, target)).toThrow("current frame")
    f.cache.endFrame()
    f.cache.beginFrame()
    expect(f.acquire(operation, target, 4, 4, true, uniform)!.hit).toBe(true)
    f.cache.endFrame()
  } finally {f.close()}
})

for (const failure of ["texture", "view", "group"] as const) {
  test(`failed ${failure} replacement preserves old output and all budget accounting`, () => {
    const f = fixture(208), operation = {}, target = {}
    try {
      f.cache.beginFrame()
      const first = f.acquire(operation, target)!
      f.cache.endFrame()
      f.cache.beginFrame()
      f.fail(failure)
      expect(() => f.acquire(operation, target, 6, 6)).toThrow("allocation failed")
      f.fail()
      expect((first.texture as Texture).destroys).toBe(0)
      expect(f.acquire(operation, target)!.hit).toBe(true)
      expect(f.textures.slice(1).every(texture => texture.destroys === 1)).toBe(true)
      expect(f.acquire({}, target, 6, 6)).not.toBeNull()
      expect(f.acquire({}, target, 1, 1)).toBeNull()
      f.cache.endFrame()
      f.cache.dispose()
      expect(f.textures.every(texture => texture.destroys === 1)).toBe(true)
    } finally {f.close()}
  })
}

test("failed uniform rebind does not replace a valid binding", () => {
  const f = fixture(), operation = {}, target = {}
  try {
    f.cache.beginFrame()
    const first = f.acquire(operation, target)!
    f.cache.endFrame()
    f.cache.beginFrame()
    f.fail("group")
    expect(() => f.acquire(operation, target, 4, 4, true, {} as GPUBuffer)).toThrow("allocation failed")
    f.fail()
    expect(f.acquire(operation, target)).toEqual({...first, hit: true})
    f.cache.endFrame()
  } finally {f.close()}
})

test("invalid dimensions and zero budget allocate nothing; dispose rejects future work", () => {
  const f = fixture(0)
  try {
    expect(() => f.acquire({}, {})).toThrow("beginFrame")
    f.cache.beginFrame()
    for (const width of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => f.acquire({}, {}, width, 4)).toThrow("dimensions")
    expect(f.acquire({}, {})).toBeNull()
    expect(f.textures).toHaveLength(0)
    f.cache.endFrame()
    f.cache.dispose()
    expect(() => f.cache.beginFrame()).toThrow("disposed")
    expect(() => f.acquire({}, {})).toThrow("disposed")
  } finally {f.close()}
})
