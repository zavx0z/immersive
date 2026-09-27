import {dlopen, ptr, toArrayBuffer, type Pointer} from "bun:ffi"

/** Собственные RGBA8-пиксели: строки сверху вниз, непредумноженный альфа-канал. */
export interface BitmapPixels {
  readonly width: number
  readonly height: number
  readonly data: Uint8Array
  readonly premultiplied?: boolean
}

/** Нативные кодеки среды; SVG обслуживает установленный загрузчик librsvg. */
function openDecoder() {
  const library = process.platform === "darwin"
    ? "/opt/local/lib/libgdk_pixbuf-2.0.0.dylib"
    : "libgdk_pixbuf-2.0.so.0"
  return dlopen(library, {
    gdk_pixbuf_loader_new: {args: [], returns: "ptr"},
    gdk_pixbuf_loader_write: {args: ["ptr", "ptr", "u64", "ptr"], returns: "int"},
    gdk_pixbuf_loader_close: {args: ["ptr", "ptr"], returns: "int"},
    gdk_pixbuf_loader_get_pixbuf: {args: ["ptr"], returns: "ptr"},
    gdk_pixbuf_apply_embedded_orientation: {args: ["ptr"], returns: "ptr"},
    gdk_pixbuf_get_width: {args: ["ptr"], returns: "int"},
    gdk_pixbuf_get_height: {args: ["ptr"], returns: "int"},
    gdk_pixbuf_get_rowstride: {args: ["ptr"], returns: "int"},
    gdk_pixbuf_get_n_channels: {args: ["ptr"], returns: "int"},
    gdk_pixbuf_get_pixels: {args: ["ptr"], returns: "ptr"},
    gdk_pixbuf_new_from_data: {args: ["ptr", "int", "int", "int", "int", "int", "int", "ptr", "ptr"], returns: "ptr"},
    gdk_pixbuf_scale_simple: {args: ["ptr", "int", "int", "int"], returns: "ptr"},
    g_object_unref: {args: ["ptr"], returns: "void"},
  })
}
let decoder: ReturnType<typeof openDecoder> | undefined
const api = () => (decoder ??= openDecoder()).symbols

/** Копирует буфер кодека до освобождения нативного объекта. */
function pixels(bitmap: Pointer | bigint): BitmapPixels {
  const native = api()
  const width = native.gdk_pixbuf_get_width(bitmap)
  const height = native.gdk_pixbuf_get_height(bitmap)
  const stride = native.gdk_pixbuf_get_rowstride(bitmap)
  const channels = native.gdk_pixbuf_get_n_channels(bitmap)
  const source = new Uint8Array(toArrayBuffer(native.gdk_pixbuf_get_pixels(bitmap)!, 0, stride * (height - 1) + width * channels))
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = y * stride + x * channels
      const to = (y * width + x) * 4
      data[to] = source[from]!
      data[to + 1] = source[from + 1]!
      data[to + 2] = source[from + 2]!
      data[to + 3] = channels === 4 ? source[from + 3]! : 255
    }
  }
  return {width, height, data}
}

/** Декодирует Blob штатным нативным кодеком, сохраняя браузерную ошибку недопустимого изображения. */
export async function decodeImage(blob: Blob): Promise<BitmapPixels> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  if (bytes.length === 0) throw new DOMException("Изображение пусто", "InvalidStateError")
  const native = api()
  const loader = native.gdk_pixbuf_loader_new()!
  let closed = false
  try {
    const written = native.gdk_pixbuf_loader_write(loader, ptr(bytes), bytes.length, null)
    const complete = native.gdk_pixbuf_loader_close(loader, null)
    closed = true
    if (!written || !complete) throw new DOMException("Изображение не декодируется", "InvalidStateError")
    const bitmap = native.gdk_pixbuf_loader_get_pixbuf(loader)
    if (bitmap === null) throw new DOMException("Изображение не содержит кадра", "InvalidStateError")
    const oriented = native.gdk_pixbuf_apply_embedded_orientation(bitmap)
    if (oriented === null) throw new DOMException("Не удалось применить ориентацию изображения", "InvalidStateError")
    try { return pixels(oriented) }
    finally { native.g_object_unref(oriented) }
  } finally {
    if (!closed) native.gdk_pixbuf_loader_close(loader, null)
    native.g_object_unref(loader)
  }
}

/** Изменяет размер средствами того же кодека; данные исходного ImageBitmap не меняются. */
export function resizeImage(source: BitmapPixels, width: number, height: number, quality: ResizeQuality): BitmapPixels {
  if (source.width === width && source.height === height) return source
  const native = api()
  const bitmap = native.gdk_pixbuf_new_from_data(ptr(source.data), 0, 1, 8, source.width, source.height, source.width * 4, null, null)!
  try {
    const resized = native.gdk_pixbuf_scale_simple(bitmap, width, height, quality === "pixelated" ? 0 : quality === "high" ? 3 : 2)
    if (resized === null) throw new DOMException("Не удалось изменить размер изображения", "InvalidStateError")
    try { return pixels(resized) }
    finally { native.g_object_unref(resized) }
  } finally { native.g_object_unref(bitmap) }
}
