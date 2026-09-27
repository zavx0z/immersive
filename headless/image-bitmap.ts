import {decodeImage, resizeImage, type BitmapPixels} from "./image-decoder.ts"

const token = Symbol()
const bitmaps = new WeakMap<ImageBitmap, BitmapPixels>()

/** ImageBitmap среды Headless. Создаётся через createImageBitmap, close освобождает пиксели. */
export class ImageBitmap implements globalThis.ImageBitmap {
  readonly [Symbol.toStringTag] = "ImageBitmap"
  constructor(key: symbol, pixels: BitmapPixels) {
    if (key !== token) throw new TypeError("Illegal constructor")
    bitmaps.set(this, pixels)
  }
  get width(): number { return bitmaps.get(this)?.width ?? 0 }
  get height(): number { return bitmaps.get(this)?.height ?? 0 }
  close(): void { bitmaps.delete(this) }
}

/** Чтение доступно нативной реализации GPUQueue, без расширения публичного ImageBitmap. */
export function bitmapPixels(bitmap: globalThis.ImageBitmap): BitmapPixels {
  if (!(bitmap instanceof ImageBitmap)) throw new TypeError("Ожидается ImageBitmap текущего окружения")
  const pixels = bitmaps.get(bitmap)
  if (!pixels) throw new DOMException("ImageBitmap уже закрыт", "InvalidStateError")
  return pixels
}

/** Браузерные перегрузки для Blob и ImageBitmap: crop, resize, flipY и независимый жизненный цикл. */
export function createImageBitmap(image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap>
export function createImageBitmap(image: ImageBitmapSource, sx: number, sy: number, sw: number, sh: number, options?: ImageBitmapOptions): Promise<ImageBitmap>
export async function createImageBitmap(image: ImageBitmapSource, sxOrOptions: number | ImageBitmapOptions = {}, sy?: number, sw?: number, sh?: number, cropOptions?: ImageBitmapOptions): Promise<ImageBitmap> {
  const cropped = typeof sxOrOptions === "number"
  const options = cropped ? cropOptions ?? {} : sxOrOptions
  if (options.resizeWidth === 0 || options.resizeHeight === 0) throw new DOMException("Размер ImageBitmap равен нулю", "InvalidStateError")
  if (options.premultiplyAlpha && !["default", "none", "premultiply"].includes(options.premultiplyAlpha)) throw new TypeError("Недопустимый premultiplyAlpha")
  if (options.colorSpaceConversion && !["default", "none"].includes(options.colorSpaceConversion)) throw new TypeError("Недопустимый colorSpaceConversion")
  if (options.imageOrientation && !["from-image", "flipY"].includes(options.imageOrientation)) throw new TypeError("Недопустимый imageOrientation")
  if (options.resizeQuality && !["pixelated", "low", "medium", "high"].includes(options.resizeQuality)) throw new TypeError("Недопустимый resizeQuality")
  let source: BitmapPixels
  if (image instanceof Blob) source = await decodeImage(image)
  else if (image instanceof ImageBitmap) source = bitmapPixels(image)
  else throw new DOMException("Этот источник ImageBitmap ещё не реализован в Headless", "NotSupportedError")
  if (source.premultiplied) {
    const data = source.data.slice()
    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3]!
      for (let channel = 0; channel < 3; channel++) data[index + channel] = alpha === 0 ? 0 : Math.min(255, Math.round(data[index + channel]! * 255 / alpha))
    }
    source = {width: source.width, height: source.height, data}
  }
  let x = cropped ? sxOrOptions >> 0 : 0
  let y = cropped ? (sy ?? 0) >> 0 : 0
  let width = cropped ? (sw ?? 0) >> 0 : source.width
  let height = cropped ? (sh ?? 0) >> 0 : source.height
  if (width === 0 || height === 0) throw new RangeError("Область ImageBitmap имеет нулевой размер")
  if (width < 0) { x += width; width = -width }
  if (height < 0) { y += height; height = -height }
  const data = new Uint8Array(width * height * 4)
  for (let row = Math.max(0, -y); row < Math.min(height, source.height - y); row++) {
    const left = Math.max(0, -x)
    const right = Math.min(width, source.width - x)
    if (right > left) data.set(source.data.subarray(((y + row) * source.width + x + left) * 4, ((y + row) * source.width + x + right) * 4), (row * width + left) * 4)
  }
  const targetWidth = options.resizeWidth === undefined ? options.resizeHeight === undefined ? width : Math.ceil(width * options.resizeHeight / height) : options.resizeWidth
  const targetHeight = options.resizeHeight === undefined ? options.resizeWidth === undefined ? height : Math.ceil(height * options.resizeWidth / width) : options.resizeHeight
  if (![targetWidth, targetHeight].every(value => Number.isSafeInteger(value) && value > 0)) throw new DOMException("Недопустимый размер ImageBitmap", "InvalidStateError")
  let result = resizeImage({width, height, data}, targetWidth, targetHeight, options.resizeQuality ?? "low")
  if (options.imageOrientation === "flipY") {
    const flipped = new Uint8Array(result.data.length)
    const stride = result.width * 4
    for (let row = 0; row < result.height; row++) flipped.set(result.data.subarray(row * stride, (row + 1) * stride), (result.height - row - 1) * stride)
    result = {...result, data: flipped}
  }
  if (options.premultiplyAlpha === "premultiply") {
    for (let index = 0; index < result.data.length; index += 4) {
      const alpha = result.data[index + 3]! / 255
      for (let channel = 0; channel < 3; channel++) result.data[index + channel] = Math.round(result.data[index + channel]! * alpha)
    }
    result = {...result, premultiplied: true}
  }
  return new ImageBitmap(token, result)
}
