import {bitmapPixels} from "./image-bitmap.ts"

/** Браузерный метод GPUQueue для нативного устройства; загрузчик текстур использует его без веток по среде. */
export function installExternalImageCopy(device: GPUDevice): void {
  const queue = device.queue
  queue.copyExternalImageToTexture = (source, destination, copySize) => {
    const bitmap = bitmapPixels(source.source as ImageBitmap)
    const origin = source.origin ?? {}
    const [x = 0, y = 0] = Symbol.iterator in Object(origin)
      ? [...origin as Iterable<number>]
      : [(origin as GPUOrigin2DDict).x ?? 0, (origin as GPUOrigin2DDict).y ?? 0]
    const [width = 0, height = 1, depth = 1] = Symbol.iterator in Object(copySize)
      ? [...copySize as Iterable<number>]
      : [(copySize as GPUExtent3DDict).width, (copySize as GPUExtent3DDict).height ?? 1, (copySize as GPUExtent3DDict).depthOrArrayLayers ?? 1]
    if (![x, y, width, height, depth].every(value => Number.isSafeInteger(value) && value >= 0)) throw new TypeError("Координаты и размеры копирования должны быть неотрицательными целыми")
    if (x + width > bitmap.width || y + height > bitmap.height || depth > 1) throw new DOMException("Область копирования выходит за ImageBitmap", "OperationError")
    if (destination.colorSpace && destination.colorSpace !== "srgb") throw new DOMException("Цветовое пространство назначения ещё не реализовано в Headless", "NotSupportedError")
    const format = destination.texture.format
    if (!["rgba8unorm", "rgba8unorm-srgb", "bgra8unorm", "bgra8unorm-srgb"].includes(format)) throw new DOMException(`Копирование ImageBitmap в ${format} ещё не реализовано`, "NotSupportedError")
    if (width === 0 || height === 0 || depth === 0) return
    const data = new Uint8Array(width * height * 4)
    const bgra = format.startsWith("bgra")
    for (let row = 0; row < height; row++) {
      const sourceY = y + (source.flipY ? height - row - 1 : row)
      for (let column = 0; column < width; column++) {
        const from = (sourceY * bitmap.width + x + column) * 4
        const to = (row * width + column) * 4
        const alpha = bitmap.data[from + 3]!
        const scale = Boolean(bitmap.premultiplied) === Boolean(destination.premultipliedAlpha)
          ? 1
          : destination.premultipliedAlpha ? alpha / 255 : alpha === 0 ? 0 : 255 / alpha
        data[to] = Math.round(bitmap.data[from + (bgra ? 2 : 0)]! * scale)
        data[to + 1] = Math.round(bitmap.data[from + 1]! * scale)
        data[to + 2] = Math.round(bitmap.data[from + (bgra ? 0 : 2)]! * scale)
        data[to + 3] = alpha
      }
    }
    queue.writeTexture(destination, data, {bytesPerRow: width * 4, rowsPerImage: height}, {width, height, depthOrArrayLayers: depth})
  }
}
