import {expect, test} from "bun:test"
import {createImageBitmap, bitmapPixels, ImageBitmap} from "../image-bitmap.ts"
import {imageFromRgba} from "../image.ts"

const rgba = new Uint8Array([
  255, 0, 0, 255, 0, 255, 0, 255,
  0, 0, 255, 255, 200, 100, 50, 128,
])
const blob = await imageFromRgba(rgba, 2, 2).png().blob()

test("PNG сохраняет размеры, каналы и прозрачность; close отсоединяет только свой bitmap", async () => {
  const original = await createImageBitmap(blob)
  const copy = await createImageBitmap(original)
  expect(Object.prototype.toString.call(original)).toBe("[object ImageBitmap]")
  expect([original.width, original.height]).toEqual([2, 2])
  expect(bitmapPixels(original).data).toEqual(rgba)
  original.close()
  original.close()
  expect([original.width, original.height]).toEqual([0, 0])
  expect(bitmapPixels(copy).data).toEqual(rgba)
  await expect(createImageBitmap(original)).rejects.toMatchObject({name: "InvalidStateError"})
  copy.close()
})

test("SVG декодируется штатным кодеком без браузера", async () => {
  const bitmap = await createImageBitmap(new Blob([
    '<svg xmlns="http://www.w3.org/2000/svg" width="3" height="2"><rect width="3" height="2" fill="#2468ac"/></svg>',
  ], {type: "image/svg+xml"}))
  expect([bitmap.width, bitmap.height]).toEqual([3, 2])
  expect([...bitmapPixels(bitmap).data]).toEqual(Array(6).fill([36, 104, 172, 255]).flat())
  bitmap.close()
})

test("область вне изображения заполняется прозрачными пикселями, отрицательный размер переносит начало", async () => {
  const outside = await createImageBitmap(blob, -1, -1, 2, 2)
  expect([...bitmapPixels(outside).data]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 255])
  const negative = await createImageBitmap(blob, 2, 1, -2, -1)
  expect([...bitmapPixels(negative).data]).toEqual([...rgba.slice(0, 8)])
  outside.close()
  negative.close()
})

test("resize и flipY меняют только созданное изображение", async () => {
  const bitmap = await createImageBitmap(blob, 0, 0, 2, 1, {resizeWidth: 4, resizeQuality: "pixelated"})
  expect([bitmap.width, bitmap.height]).toEqual([4, 2])
  expect([...bitmapPixels(bitmap).data.slice(0, 16)]).toEqual([255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255, 0, 255, 0, 255])
  const flipped = await createImageBitmap(blob, {imageOrientation: "flipY"})
  expect([...bitmapPixels(flipped).data]).toEqual([...rgba.slice(8), ...rgba.slice(0, 8)])
  bitmap.close()
  flipped.close()
})

test("предумножение альфа-канала выполняется по явному запросу", async () => {
  const bitmap = await createImageBitmap(blob, {premultiplyAlpha: "premultiply"})
  expect([...bitmapPixels(bitmap).data.slice(12)]).toEqual([100, 50, 25, 128])
  bitmap.close()
})

test("повреждённый Blob и нулевая область не создают успешный ImageBitmap", async () => {
  await expect(createImageBitmap(new Blob(["not an image"]))).rejects.toMatchObject({name: "InvalidStateError"})
  await expect(createImageBitmap(blob, 0, 0, 0, 2)).rejects.toBeInstanceOf(RangeError)
  await expect(createImageBitmap(blob, {resizeWidth: 0})).rejects.toMatchObject({name: "InvalidStateError"})
  expect(() => new ImageBitmap(Symbol(), {width: 1, height: 1, data: new Uint8Array(4)})).toThrow(TypeError)
})
