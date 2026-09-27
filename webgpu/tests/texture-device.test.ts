import {expect, test} from "bun:test"
import {TextureLoader} from "../src/texture-loader.ts"

/** Замена устройства не передаёт ему текстуры и fallback прежнего устройства. */
test("TextureLoader повторно загружает изображение при смене GPUDevice", async () => {
  const originalFetch = globalThis.fetch
  const originalBitmap = globalThis.createImageBitmap
  const originalUsage = globalThis.GPUTextureUsage
  globalThis.GPUTextureUsage = {TEXTURE_BINDING: 1, COPY_DST: 2, RENDER_ATTACHMENT: 4} as typeof GPUTextureUsage
  globalThis.fetch = (async () => new Response("bitmap")) as unknown as typeof fetch
  globalThis.createImageBitmap = (async () => ({width: 2, height: 2, close() {}})) as typeof createImageBitmap
  const device = () => {
    const owner = {
      createTexture() { return {owner, destroy() {}} },
      queue: {
        writeTexture() {},
        copyExternalImageToTexture(_source: unknown, target: {texture: {owner: unknown}}) {
          expect(target.texture.owner).toBe(owner)
        },
      },
    }
    return owner as unknown as GPUDevice
  }
  const src = "https://fixture.invalid/device-replacement.png"
  const load = (owner: GPUDevice) => new Promise<ReturnType<typeof TextureLoader.load>>(resolve => {
    const changed = () => {
      const entry = TextureLoader.peek(src)!
      if (entry.status !== "ready") return
      TextureLoader.removeChangeListener(src, changed)
      resolve(entry)
    }
    const entry = TextureLoader.load(owner, src, changed)
    if (entry.status === "ready") changed()
  })
  try {
    const first = device()
    const second = device()
    const before = await load(first)
    const previousTexture = before.texture
    const after = await load(second)
    expect(after).not.toBe(before)
    expect(after.texture).not.toBe(previousTexture)
    expect(after.device).toBe(second)
    expect(before.texture).toBe(previousTexture)
    expect(TextureLoader.load(second, src)).toBe(after)
    const firstFallback = TextureLoader.fallback(first)
    expect(TextureLoader.fallback(second)).not.toBe(firstFallback)
    expect(TextureLoader.fallback(first)).toBe(firstFallback)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.createImageBitmap = originalBitmap
    globalThis.GPUTextureUsage = originalUsage
  }
})
