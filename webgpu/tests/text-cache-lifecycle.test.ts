import {expect, spyOn, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {CachedText, Text, TrueTypeFont} from "@zavx0z/immersive-engine"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {RendererWebGpuBackend} from "../src/webgpu-backend.ts"

const readFont = () => Bun.file(new URL("../../engine/static/font/inter-regular.ttf", import.meta.url)).arrayBuffer().then(data => new TrueTypeFont(data))
const textNodes = (backend: RendererWebGpuBackend) => {
  const nodes: CachedText[] = []
  backend.root.traverse(node => { if (node instanceof CachedText) nodes.push(node) })
  return nodes
}
const fixture = (font: TrueTypeFont) => {
  const backend = new RendererWebGpuBackend({font, invalidateGeometry() {}})
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "width:300px;height:100px")
  const paragraph = document.createElement("p")
  paragraph.setAttribute("style", "font-size:16px;letter-spacing:0;line-height:20px;margin:0")
  paragraph.textContent = "Одинаковая подпись"
  root.append(paragraph)
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 300, height: 100}, textMeasurer: backend.textMeasurer!})
  return {backend, document, root, paragraph, renderer}
}

test("backend строит UI текст один раз с окончательными параметрами и освобождает только свои leases", async () => {
  const font = await readFont()
  const first = fixture(font)
  const second = fixture(font)
  const before = Text.getLayoutCacheStats().activeUsers
  const updates = spyOn(Text.prototype, "updateGeometry")
  try {
    first.backend.applyFrame(first.renderer.flush())
    expect(updates).toHaveBeenCalledTimes(1)
    const text = textNodes(first.backend)[0]!
    expect(text.letterSpacing).toBe(0)
    expect(text.spaceAdvance).toBe(font.getHMetric(font.mapCharToGlyph(32)).advanceWidth / font.unitsPerEm * 16)
    second.backend.applyFrame(second.renderer.flush())
    expect(updates).toHaveBeenCalledTimes(2)
    const peer = textNodes(second.backend)[0]!
    const geometry = peer.stencilGeometry
    expect(text.stencilGeometry).toBe(geometry)
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 2)
    first.paragraph.remove()
    first.backend.applyFrame(first.renderer.flush())
    expect(textNodes(first.backend)).toEqual([])
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 1)
    expect(peer.stencilGeometry).toBe(geometry)
    expect(Text.isCachedLayoutGeometry(geometry)).toBeTrue()
    first.backend.dispose()
    first.backend.dispose()
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 1)
    second.paragraph.setAttribute("style", "font-size:24px;letter-spacing:2px;line-height:28px;margin:0")
    second.backend.applyFrame(second.renderer.flush())
    expect(updates).toHaveBeenCalledTimes(3)
    expect(peer.fontSize).toBe(24)
    expect(peer.letterSpacing).toBe(2)
    expect(peer.stencilGeometry).not.toBe(geometry)
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 1)
  } finally {
    updates.mockRestore()
    first.renderer.dispose()
    second.renderer.dispose()
    first.backend.dispose()
    second.backend.dispose()
  }
  expect(Text.getLayoutCacheStats().activeUsers).toBe(before)
})
