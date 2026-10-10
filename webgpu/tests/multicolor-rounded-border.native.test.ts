import {expect, test} from "bun:test"
import {createHeadless} from "../../headless/index.ts"

const probes = [
  [48, 3, [255, 0, 0]], [92, 40, [0, 255, 0]],
  [48, 76, [0, 0, 255]], [3, 40, [255, 255, 0]],
  [16, 3, [255, 0, 0]], [3, 16, [255, 255, 0]],
  [79, 3, [255, 0, 0]], [92, 16, [0, 255, 0]],
  [79, 76, [0, 0, 255]], [92, 63, [0, 255, 0]],
  [16, 76, [0, 0, 255]], [3, 63, [255, 255, 0]],
  [48, 40, [255, 255, 255]],
] as const

for (const count of [1, 2]) {
  test(`[HEADLESS-MULTICOLOR-BORDER] ${count === 1 ? "scalar" : "instanced"} GPU рисует четыре стороны и скруглённые переходы`, async () => {
    const width = count * 104 - 8
    const headless = createHeadless({width, height: 80, styleSheetSources: []})
    try {
      const {Boxes} = await import("./multicolor-rounded-border.fixture.tsx")
      const root = await headless.renderComponent(Boxes, {count})
      const frame = await headless.capture(root)
      expect([frame.width, frame.height]).toEqual([width, 80])
      const pixel = (x: number, y: number) => [...frame.rgba.slice((y * width + x) * 4, (y * width + x + 1) * 4)]
      for (let index = 0; index < count; index += 1) {
        for (const [x, y, expected] of probes) {
          const actual = pixel(index * 104 + x, y)
          expect(actual[3], `Alpha в (${index * 104 + x}, ${y})`).toBeGreaterThanOrEqual(254)
          for (let channel = 0; channel < 3; channel += 1) {
            expect(Math.abs(actual[channel]! - expected[channel]!), `RGBA в (${index * 104 + x}, ${y}): ${actual}`).toBeLessThanOrEqual(1)
          }
        }
        expect(pixel(index * 104, 0).slice(0, 3), "Угол вне outer rounded contour сохраняет фон").toEqual([0, 0, 0])
      }
      const first = root.firstElementChild!
      first.setAttribute("style", `${first.getAttribute("style")};border-top-width:3px;border-right-width:9px;border-bottom-width:5px;border-left-width:13px;border-right-color:rgba(0,255,0,0.25)`)
      const asymmetric = await headless.capture(root)
      const asymmetricPixel = (x: number, y: number) => [...asymmetric.rgba.slice((y * width + x) * 4, (y * width + x + 1) * 4)]
      expect(asymmetricPixel(48, 1).slice(0, 3)).toEqual([255, 0, 0])
      expect(asymmetricPixel(92, 40).slice(0, 3)).toEqual([0, 64, 0])
      expect(asymmetricPixel(48, 77).slice(0, 3)).toEqual([0, 0, 255])
      expect(asymmetricPixel(3, 40).slice(0, 3)).toEqual([255, 255, 0])
      first.setAttribute("style", `${first.getAttribute("style")};border-right-color:transparent;border-left-width:0`)
      const transparent = await headless.capture(root)
      const changedPixel = (x: number, y: number) => [...transparent.rgba.slice((y * width + x) * 4, (y * width + x + 1) * 4)]
      expect(changedPixel(92, 40).slice(0, 3), "Прозрачная рамка не окрашивает сторону зелёным").toEqual([0, 0, 0])
      expect(changedPixel(3, 40), "Сторона нулевой ширины показывает заливку").toEqual([255, 255, 255, 255])
      expect(changedPixel(48, 1)).toEqual([255, 0, 0, 255])
      expect(changedPixel(48, 76)).toEqual([0, 0, 255, 255])
      if (count === 2) expect(changedPixel(104 + 92, 40)).toEqual([0, 255, 0, 255])
    } finally { await headless.dispose() }
  }, 30_000)
}
