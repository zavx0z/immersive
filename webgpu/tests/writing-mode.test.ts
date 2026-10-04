import {expect, test} from "bun:test"
import {createDocument} from "@immersive/dom"
import {TrueTypeFont, Text} from "@immersive/engine"
import {createDocumentRenderer} from "@immersive-renderer/html"
import {RendererWebGpuBackend} from "../src/webgpu-backend.ts"

/** Проверяет реальную TTF-геометрию, retained identity и culling вертикальной строки. */
test("vertical text uses one retained Text and rotated ink bounds", async () => {
  const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/font/inter-regular.ttf", import.meta.url)).arrayBuffer())
  const backend = new RendererWebGpuBackend({font, invalidateGeometry() {}})
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "width:100px;height:160px;overflow:hidden")
  const label = document.createElement("span")
  const style = "position:absolute;left:5px;top:4px;font-size:14px;line-height:20px;white-space:nowrap;text-orientation:sideways;writing-mode:"
  label.setAttribute("style", style + "vertical-rl")
  label.textContent = "Вертикально"
  root.append(label)
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 100, height: 160}, textMeasurer: backend.textMeasurer!})
  try {
    backend.applyFrame(renderer.flush())
    const texts: Text[] = []
    backend.root.traverse(node => { if (node instanceof Text) texts.push(node) })
    expect(texts).toHaveLength(1)
    const text = texts[0]!
    const stencil = text.stencilGeometry
    const cover = text.coverGeometry
    expect(text.visible).toBeTrue()
    expect(text.rotation.z).toBeCloseTo(-Math.PI / 2)
    const expectedBaseline = backend.textMeasurer!.measureTextBaseline!(14, 20)
    expect(text.position.x).toBeCloseTo(5 + 20 - expectedBaseline)
    expect(text.position.y).toBe(-4)
    label.setAttribute("style", style + "sideways-lr")
    const frame = renderer.flush()
    backend.applyFrame(frame)
    expect(text.rotation.z).toBeCloseTo(Math.PI / 2)
    expect(text.position.x).toBeCloseTo(5 + expectedBaseline)
    expect(text.position.y).toBeCloseTo(-4 - frame.boxByNode.get(label.firstChild!)!.height)
    expect(text.stencilGeometry).toBe(stencil)
    expect(text.coverGeometry).toBe(cover)
    label.setAttribute("style", style + "horizontal-tb")
    backend.applyFrame(renderer.flush())
    expect(text.rotation.z).toBe(0)
    label.setAttribute("style", style.replace("left:5px", "left:120px") + "vertical-rl")
    backend.applyFrame(renderer.flush())
    expect(text.visible).toBeFalse()
    label.setAttribute("style", style + "vertical-rl")
    backend.applyFrame(renderer.flush())
    expect(text.visible).toBeTrue()
    expect(text.stencilGeometry).toBe(stencil)
  } finally {
    renderer.dispose()
    backend.dispose()
  }
})
