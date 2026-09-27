import {expect, test} from "bun:test"
import {createHeadless} from "../index.ts"
import {ImageBox} from "../fixtures/elements.tsx"

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="4"><rect width="4" height="4" fill="red"/><rect x="4" width="4" height="4" fill="blue"/></svg>'

test("браузерный путь изображения доходит до пикселей GPU и восстанавливает globals", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap")
  for (let iteration = 0; iteration < 2; iteration++) {
    const headless = createHeadless({width: 8, height: 4, styleSheetSources: []})
    try {
      const element = await headless.renderComponent(ImageBox, {src: `data:image/svg+xml,${encodeURIComponent(svg)}`})
      const frame = await headless.capture(element)
      expect([frame.width, frame.height]).toEqual([8, 4])
      expect([...frame.rgba.slice((2 * 8 + 1) * 4, (2 * 8 + 2) * 4)]).toEqual([255, 0, 0, 255])
      expect([...frame.rgba.slice((2 * 8 + 6) * 4, (2 * 8 + 7) * 4)]).toEqual([0, 0, 255, 255])
      expect(Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap")).toEqual(previous)
    } finally { await headless.dispose() }
  }
}, 30_000)

test("ошибка декодирования не превращается в прозрачный успешный кадр", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap")
  const headless = createHeadless({width: 8, height: 4, styleSheetSources: []})
  try {
    await expect(headless.renderComponent(ImageBox, {src: "data:image/png;base64,YmFk"})).rejects.toThrow("Headless не смог загрузить изображение")
    expect(Object.getOwnPropertyDescriptor(globalThis, "createImageBitmap")).toEqual(previous)
  } finally { await headless.dispose() }
}, 30_000)
