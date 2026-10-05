import {afterEach, expect, test} from "bun:test"
import {randomUUID} from "node:crypto"
import {TextureLoader} from "../src/texture-loader.ts"
import {Renderer} from "../src/renderer/index.ts"

const cleanup: (() => void)[] = []
afterEach(() => {for (const action of cleanup.splice(0).reverse()) action()})
const tick = () => Bun.sleep(0)
function fixture(width = 2, height = 2) {
  const fetch = globalThis.fetch
  const createBitmap = globalThis.createImageBitmap
  const usage = globalThis.GPUTextureUsage
  cleanup.push(() => {
    globalThis.fetch = fetch
    globalThis.createImageBitmap = createBitmap
    globalThis.GPUTextureUsage = usage
  })
  globalThis.GPUTextureUsage = {TEXTURE_BINDING: 1, COPY_DST: 2, RENDER_ATTACHMENT: 4} as typeof GPUTextureUsage
  const bitmaps: {width: number; height: number; closed: number; close(): void}[] = []
  const signals: AbortSignal[] = []
  const bitmap = (w = width, h = height) => {
    const value = {width: w, height: h, closed: 0, close() {this.closed++}}
    bitmaps.push(value)
    return value
  }
  globalThis.fetch = (async (_url: unknown, options?: RequestInit) => {
    if (options?.signal) signals.push(options.signal)
    return new Response("bitmap")
  }) as typeof globalThis.fetch
  globalThis.createImageBitmap = (async () => bitmap()) as unknown as typeof createImageBitmap
  const device = () => {
    const textures: {destroyed: number; owner: object; destroy(): void}[] = []
    const uploads: {width: number; height: number}[] = []
    const value = {
      textures, uploads,
      createTexture() {
        const texture = {owner: value, destroyed: 0, destroy() {this.destroyed++}}
        textures.push(texture)
        return texture
      },
      queue: {
        writeTexture() {},
        copyExternalImageToTexture(_source: unknown, target: {texture: {owner: object}}, size: {width: number; height: number}) {
          expect(target.texture.owner).toBe(value)
          uploads.push(size)
        },
        async onSubmittedWorkDone() {},
      },
    }
    const gpu = value as unknown as GPUDevice
    cleanup.push(() => TextureLoader.disposeDevice(gpu))
    return {gpu, ...value}
  }
  const prefix = `https://fixture.invalid/${randomUUID()}`
  return {device, bitmap, bitmaps, signals, src: (label: string) => {
    const src = `${prefix}/${label}.png`
    cleanup.push(() => TextureLoader.releaseSource(src))
    return src
  }}
}
async function ready(src: string, device: GPUDevice): Promise<void> {
  for (let index = 0; index < 200; index++) {
    const entry = TextureLoader.peek(src, device)
    if (entry?.status === "ready") return
    if (entry?.status === "failed") throw entry.error
    await tick()
  }
  throw new Error("Texture did not become ready")
}

test("same source/device shares upload; one release cannot destroy another active consumer", async () => {
  const f = fixture()
  const device = f.device()
  const src = f.src("shared")
  const first = TextureLoader.acquire(src, () => {}, {animate: false})
  const second = TextureLoader.acquire(src, () => {}, {animate: false})
  const before = first.load(device.gpu)
  expect(second.load(device.gpu)).toBe(before)
  await ready(src, device.gpu)
  expect(device.textures).toHaveLength(1)
  expect(f.bitmaps).toHaveLength(1)
  expect(f.bitmaps[0]!.closed).toBe(1)
  first.release()
  first.release()
  expect(device.textures[0]!.destroyed).toBe(0)
  expect(second.peek(device.gpu)?.texture).toBe(before.texture)
  second.release()
  const again = TextureLoader.acquire(src, () => {})
  expect(again.load(device.gpu)).toBe(before)
  expect(device.textures).toHaveLength(1)
  again.release()
})

test("released device A is independent from active source on device B", async () => {
  const f = fixture()
  const a = f.device()
  const b = f.device()
  const src = f.src("two-devices")
  const first = TextureLoader.acquire(src, () => {})
  const second = TextureLoader.acquire(src, () => {})
  first.load(a.gpu)
  await ready(src, a.gpu)
  second.load(b.gpu)
  await ready(src, b.gpu)
  expect(a.textures).toHaveLength(1)
  expect(b.textures).toHaveLength(1)
  first.release()
  TextureLoader.disposeDevice(a.gpu)
  expect(a.textures[0]!.destroyed).toBe(1)
  expect(b.textures[0]!.destroyed).toBe(0)
  expect(second.peek(b.gpu)?.texture).not.toBeNull()
  expect(TextureLoader.peek(src, a.gpu)).toBeUndefined()
  second.release()
})

test("inactive LRU is bounded by bytes and entry count; active texture survives pressure and cold reload uploads again", async () => {
  const f = fixture(1024, 1024)
  const device = f.device()
  const activeSrc = f.src("active")
  const active = TextureLoader.acquire(activeSrc, () => {})
  active.load(device.gpu)
  await ready(activeSrc, device.gpu)
  const texture = device.textures[0]!
  const oldest = f.src("cold-0")
  for (let index = 0; index < 12; index++) {
    const src = f.src(`cold-${index}`)
    const lease = TextureLoader.acquire(src, () => {})
    lease.load(device.gpu)
    await ready(src, device.gpu)
    lease.release()
    expect(TextureLoader.diagnostics().inactiveBytes).toBeLessThanOrEqual(32 * 1024 * 1024)
    expect(texture.destroyed).toBe(0)
  }
  expect(TextureLoader.peek(oldest, device.gpu)).toBeUndefined()
  const count = device.textures.length
  const cold = TextureLoader.acquire(oldest, () => {})
  cold.load(device.gpu)
  await ready(oldest, device.gpu)
  expect(device.textures).toHaveLength(count + 1)
  cold.release()
  active.release()
  for (let index = 0; index < 150; index++) {
    const src = f.src(`tiny-${index}`)
    const lease = TextureLoader.acquire(src, () => {})
    TextureLoader.replaceBitmap(src, f.bitmap(1, 1) as unknown as ImageBitmap)
    lease.load(device.gpu)
    await ready(src, device.gpu)
    lease.release()
    expect(TextureLoader.diagnostics().inactiveEntries).toBeLessThanOrEqual(128)
  }
})

test("last release aborts loading; late decoded bitmap closes without upload or resurrected entry", async () => {
  const f = fixture()
  const device = f.device()
  const src = f.src("late")
  const decoded = Promise.withResolvers<ImageBitmap>()
  const started = Promise.withResolvers<void>()
  globalThis.createImageBitmap = (() => {
    started.resolve()
    return decoded.promise
  }) as typeof createImageBitmap
  let notifications = 0
  const lease = TextureLoader.acquire(src, () => {notifications++})
  lease.load(device.gpu)
  await started.promise
  lease.release()
  expect(f.signals[0]!.aborted).toBeTrue()
  const bitmap = f.bitmap()
  decoded.resolve(bitmap as unknown as ImageBitmap)
  await tick()
  expect(bitmap.closed).toBe(1)
  expect(device.textures).toHaveLength(0)
  expect(TextureLoader.peek(src, device.gpu)).toBeUndefined()
  expect(notifications).toBe(0)
})

test("source replacement invalidates previous decode and preserves new bitmap", async () => {
  const f = fixture()
  const device = f.device()
  const src = f.src("replacement")
  const decoded = Promise.withResolvers<ImageBitmap>()
  const started = Promise.withResolvers<void>()
  globalThis.createImageBitmap = (() => {
    started.resolve()
    return decoded.promise
  }) as typeof createImageBitmap
  const lease = TextureLoader.acquire(src, () => {})
  lease.load(device.gpu)
  await started.promise
  const replacement = f.bitmap(30, 20)
  TextureLoader.replaceBitmap(src, replacement as unknown as ImageBitmap)
  await ready(src, device.gpu)
  const late = f.bitmap(3, 2)
  decoded.resolve(late as unknown as ImageBitmap)
  await tick()
  expect(lease.peek(device.gpu)).toMatchObject({width: 30, height: 20, status: "ready"})
  expect(device.uploads).toEqual([{width: 30, height: 20}])
  expect(late.closed).toBe(1)
  expect(replacement.closed).toBe(0)
  lease.release()
  TextureLoader.disposeDevice(device.gpu)
  expect(replacement.closed).toBe(1)
})

test("failed load releases its entry after last owner and same source can retry", async () => {
  const f = fixture()
  const device = f.device()
  const src = f.src("failed")
  globalThis.fetch = (async () => new Response("failed", {status: 404})) as unknown as typeof fetch
  const failed = Promise.withResolvers<void>()
  const first = TextureLoader.acquire(src, () => {if (first.peek(device.gpu)?.status === "failed") failed.resolve()})
  first.load(device.gpu)
  await failed.promise
  first.release()
  expect(TextureLoader.peek(src, device.gpu)).toBeUndefined()
  globalThis.fetch = (async () => new Response("bitmap")) as unknown as typeof fetch
  const retry = TextureLoader.acquire(src, () => {})
  retry.load(device.gpu)
  await ready(src, device.gpu)
  expect(device.textures).toHaveLength(1)
  retry.release()
})

test("sizing signal release cancels removed pending image without late callback", async () => {
  const f = fixture()
  const device = f.device()
  const src = f.src("size")
  const renderer = new Renderer()
  Object.assign(renderer, {device: device.gpu})
  cleanup.push(() => renderer.dispose())
  const decoded = Promise.withResolvers<ImageBitmap>()
  const started = Promise.withResolvers<void>()
  globalThis.createImageBitmap = (() => {
    started.resolve()
    return decoded.promise
  }) as typeof createImageBitmap
  const controller = new AbortController()
  let callbacks = 0
  expect(renderer.readImageSize(src, () => {callbacks++}, controller.signal)).toBeNull()
  await started.promise
  controller.abort()
  const bitmap = f.bitmap()
  decoded.resolve(bitmap as unknown as ImageBitmap)
  await tick()
  expect(bitmap.closed).toBe(1)
  expect(callbacks).toBe(0)
  expect(device.textures).toHaveLength(0)
})

test("one active source on B cannot pin textures of many released devices", async () => {
  const f = fixture(1, 1)
  const b = f.device()
  const src = f.src("device-pressure")
  const active = TextureLoader.acquire(src, () => {})
  active.load(b.gpu)
  await ready(src, b.gpu)
  const released: ReturnType<typeof f.device>[] = []
  for (let index = 0; index < 140; index++) {
    const device = f.device()
    released.push(device)
    const lease = TextureLoader.acquire(src, () => {})
    lease.load(device.gpu)
    await ready(src, device.gpu)
    lease.release()
    expect(TextureLoader.diagnostics().inactiveEntries).toBeLessThanOrEqual(128)
    expect(b.textures[0]!.destroyed).toBe(0)
  }
  expect(released[0]!.textures[0]!.destroyed).toBe(1)
  expect(active.peek(b.gpu)?.status).toBe("ready")
  active.release()
})

test("replacement before scheduled fetch keeps replacement and does not start old source", async () => {
  const f = fixture()
  const device = f.device()
  const src = f.src("early-replacement")
  const lease = TextureLoader.acquire(src, () => {})
  lease.load(device.gpu)
  const bitmap = f.bitmap(9, 7)
  TextureLoader.replaceBitmap(src, bitmap as unknown as ImageBitmap)
  await tick()
  expect(f.signals).toHaveLength(0)
  expect(device.uploads).toEqual([{width: 9, height: 7}])
  expect(bitmap.closed).toBe(0)
  expect(lease.peek(device.gpu)).toMatchObject({width: 9, height: 7, status: "ready"})
  lease.release()
  TextureLoader.disposeDevice(device.gpu)
  expect(bitmap.closed).toBe(1)
})

test("opaque bitmap published before consumer survives handoff and additional device", async () => {
  const f = fixture()
  const a = f.device()
  const b = f.device()
  const src = `metafor:${randomUUID()}`
  cleanup.push(() => TextureLoader.releaseSource(src))
  const bitmap = f.bitmap(3000, 3000)
  TextureLoader.replaceBitmap(src, bitmap as unknown as ImageBitmap)
  await tick()
  expect(bitmap.closed).toBe(0)
  expect(TextureLoader.diagnostics().pendingProducerEntries).toBeGreaterThan(0)
  const first = TextureLoader.acquire(src, () => {})
  first.load(a.gpu)
  await ready(src, a.gpu)
  const second = TextureLoader.acquire(src, () => {})
  second.load(b.gpu)
  await ready(src, b.gpu)
  expect(a.uploads).toEqual([{width: 3000, height: 3000}])
  expect(b.uploads).toEqual([{width: 3000, height: 3000}])
  expect(f.signals).toHaveLength(0)
  first.release()
  expect(bitmap.closed).toBe(0)
  expect(b.textures[0]!.destroyed).toBe(0)
  second.release()
  expect(bitmap.closed).toBe(1)
  expect(TextureLoader.diagnostics().inactiveBytes).toBeLessThanOrEqual(32 * 1024 * 1024)
})

test("borrowed external source replays across devices; owned pending source closes after first copy", async () => {
  const f = fixture()
  const a = f.device()
  const b = f.device()
  const src = `metafor:${randomUUID()}`
  cleanup.push(() => TextureLoader.releaseSource(src))
  const borrowed = f.bitmap(10, 8)
  TextureLoader.replaceExternalSource(src, borrowed as unknown as GPUImageCopyExternalImage["source"], 10, 8)
  const first = TextureLoader.acquire(src, () => {})
  first.load(a.gpu)
  await ready(src, a.gpu)
  const second = TextureLoader.acquire(src, () => {})
  second.load(b.gpu)
  await ready(src, b.gpu)
  expect(a.uploads).toEqual([{width: 10, height: 8}])
  expect(b.uploads).toEqual([{width: 10, height: 8}])
  first.release()
  second.release()
  TextureLoader.disposeDevice(a.gpu)
  TextureLoader.disposeDevice(b.gpu)
  expect(borrowed.closed).toBe(0)
  const ownedSrc = `metafor:${randomUUID()}`
  cleanup.push(() => TextureLoader.releaseSource(ownedSrc))
  const owned = f.bitmap(11, 9)
  TextureLoader.replaceExternalSource(ownedSrc, owned as unknown as GPUImageCopyExternalImage["source"], 11, 9, {closeSourceAfterCopy: true})
  expect(owned.closed).toBe(0)
  const lease = TextureLoader.acquire(ownedSrc, () => {})
  lease.load(a.gpu)
  await ready(ownedSrc, a.gpu)
  await tick()
  expect(owned.closed).toBe(1)
  lease.release()
})

test("live borrowed video survives device switch and is never closed by cache", async () => {
  const f = fixture()
  const a = f.device()
  const b = f.device()
  const original = globalThis.HTMLVideoElement
  class Video {
    closed = 0
    close() {this.closed++}
  }
  globalThis.HTMLVideoElement = Video as unknown as typeof HTMLVideoElement
  cleanup.push(() => {
    if (original === undefined) delete (globalThis as {HTMLVideoElement?: typeof HTMLVideoElement}).HTMLVideoElement
    else globalThis.HTMLVideoElement = original
  })
  const src = `metafor:${randomUUID()}`
  cleanup.push(() => TextureLoader.releaseSource(src))
  const video = new Video()
  expect(TextureLoader.replaceExternalSource(src, video as unknown as HTMLVideoElement, 70, 50)).toBeTrue()
  const first = TextureLoader.acquire(src, () => {})
  first.load(a.gpu)
  await ready(src, a.gpu)
  const second = TextureLoader.acquire(src, () => {})
  second.load(b.gpu)
  await ready(src, b.gpu)
  expect(second.peek(b.gpu)).toMatchObject({width: 70, height: 50, externalTextureSource: video})
  first.release()
  TextureLoader.disposeDevice(a.gpu)
  expect(second.peek(b.gpu)?.status).toBe("ready")
  second.release()
  TextureLoader.disposeDevice(b.gpu)
  expect(video.closed).toBe(0)
})

test("unclaimed producer handoff is bounded and rejects before taking bitmap ownership", () => {
  const f = fixture(1, 1)
  for (let index = 0; index < 128; index++) TextureLoader.replaceBitmap(f.src(`producer-${index}`), f.bitmap() as unknown as ImageBitmap)
  const rejected = f.bitmap()
  expect(() => TextureLoader.replaceBitmap(f.src("overflow"), rejected as unknown as ImageBitmap)).toThrow("acquire a lease")
  expect(rejected.closed).toBe(0)
  expect(TextureLoader.diagnostics().pendingProducerEntries).toBeLessThanOrEqual(128)
})
