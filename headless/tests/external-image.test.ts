import {expect, test} from "bun:test"
import {createGPUInstance, globalConstructors} from "bun-webgpu"
import {NativeGpuCanvas} from "../native-canvas.ts"
import {installExternalImageCopy} from "../external-image.ts"
import {createImageBitmap} from "../image-bitmap.ts"
import {imageFromRgba} from "../image.ts"

const blob = await imageFromRgba(new Uint8Array([
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 200, 100, 50, 128,
]), 2, 2).png().blob()

test("copyExternalImageToTexture переносит origin, flipY и alpha в настоящую GPU-текстуру", async () => {
  const gpu = createGPUInstance()
  const canvas = new NativeGpuCanvas(1, 2)
  const bitmap = await createImageBitmap(blob)
  try {
    const adapter = await gpu.requestAdapter()
    const device = await adapter!.requestDevice()
    installExternalImageCopy(device)
    const context = canvas.getContext("webgpu")!
    context.configure({device, format: "bgra8unorm", usage: globalConstructors.GPUTextureUsage.RENDER_ATTACHMENT | globalConstructors.GPUTextureUsage.COPY_DST})
    device.queue.copyExternalImageToTexture(
      {source: bitmap, origin: [1, 0], flipY: true},
      {texture: context.getCurrentTexture(), premultipliedAlpha: true},
      [1, 2],
    )
    expect([...(await canvas.capture()).rgba]).toEqual([100, 50, 25, 128, 0, 255, 0, 255])
    bitmap.close()
    expect(() => device.queue.copyExternalImageToTexture({source: bitmap}, {texture: context.getCurrentTexture()}, [1, 1])).toThrow(DOMException)
  } finally {
    bitmap.close()
    canvas.dispose()
    gpu.destroy()
  }
}, 30_000)
