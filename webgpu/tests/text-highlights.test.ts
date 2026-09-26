import {expect, test} from "bun:test"
import {createDocument, setDocumentTextHighlights, clearDocumentTextHighlights, type HTMLElement} from "@zavx0z/dom"
import {Text, TrueTypeFont} from "@zavx0z/engine"
import {createDocumentInteractionController, createDocumentRenderer} from "@renderer/html"
import {RendererWebGpuBackend} from "../src/webgpu-backend.ts"

test("selection side channel preserves retained text and geometry while adding moving and clearing clipped highlights", async () => {
  const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/fonts/inter-regular.ttf", import.meta.url)).arrayBuffer())
  const document = createDocument()
  const root = document.createElement("section") as HTMLElement
  root.setAttribute("style", "display:block;width:200px;height:80px;overflow:auto;border:2px solid #555;border-radius:8px")
  const text = document.createElement("p")
  text.setAttribute("style", "display:block;font-size:14px;line-height:20px;white-space:pre")
  text.textContent = "first line\nsecond line\nthird line\nfourth line\nfifth line"
  root.append(text)
  document.append(root)
  const backend = new RendererWebGpuBackend({font, invalidateGeometry() {}})
  const renderer = createDocumentRenderer({document, root, viewport: {width: 250, height: 120}, textMeasurer: backend.textMeasurer!})
  const interaction = createDocumentInteractionController({document})
  const textNodes = () => backend.root.children.filter((node): node is Text => node instanceof Text)
  const highlights = () => backend.root.children.filter(node => node.name === "text-highlights").flatMap(node => node.children)
  const owner = {}
  try {
    const frame = renderer.flush()
    backend.applyFrame(frame)
    const retained = textNodes()
    const geometries = retained.map(node => node.stencilGeometry)
    const range = document.createRange()
    range.setStart(text.firstChild!, 1)
    range.setEnd(text.firstChild!, 7)
    document.getSelection().addRange(range)
    backend.applyFrame(interaction.composeFrame(frame))
    expect(backend.diagnostics.textPreparedItems).toBe(0)
    expect(textNodes()).toEqual(retained)
    expect(textNodes().every((node, index) => node.stencilGeometry === geometries[index])).toBe(true)
    const first = highlights()[0]!
    expect(highlights()).toHaveLength(1)
    expect(first.presentationClips.map(clip => [clip.kind, clip.center, clip.halfSize, clip.radii]))
      .toEqual(retained[0]!.presentationClips.map(clip => [clip.kind, clip.center, clip.halfSize, clip.radii]))
    const x = first.position.x

    document.getSelection().setBaseAndExtent(text.firstChild!, 3, text.firstChild!, 16)
    backend.applyFrame(interaction.composeFrame(frame))
    expect(highlights()).toHaveLength(2)
    expect(highlights()[0]).not.toBe(first)
    expect(highlights()[0]!.position.x).not.toBe(x)
    expect(backend.diagnostics.textPreparedItems).toBe(0)
    expect(textNodes().every((node, index) => node === retained[index] && node.stencilGeometry === geometries[index])).toBe(true)

    const extra = document.createRange()
    extra.setStart(text.firstChild!, 24)
    extra.collapse(true)
    setDocumentTextHighlights(document, owner, [extra], {caretColor: "#ffffff"})
    backend.applyFrame(interaction.composeFrame(frame))
    expect(highlights()).toHaveLength(3)
    expect(backend.diagnostics.textPreparedItems).toBe(0)

    document.getSelection().removeAllRanges()
    clearDocumentTextHighlights(document, owner)
    backend.applyFrame(interaction.composeFrame(frame))
    expect(highlights()).toHaveLength(0)
    expect(backend.diagnostics.textPreparedItems).toBe(0)
    expect(textNodes().every((node, index) => node === retained[index] && node.stencilGeometry === geometries[index])).toBe(true)
  } finally {
    interaction.dispose()
    renderer.dispose()
    backend.dispose()
  }
})

test("visible selection rectangles follow scroll clips without changing retained glyph geometry", async () => {
  const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/fonts/inter-regular.ttf", import.meta.url)).arrayBuffer())
  const document = createDocument()
  const root = document.createElement("section") as HTMLElement
  root.setAttribute("style", "width:180px;height:60px;overflow:auto;border-radius:10px")
  const rows = Array.from({length: 200}, (_, index) => {
    const row = document.createElement("p")
    row.setAttribute("style", "height:20px;line-height:20px;white-space:pre")
    row.textContent = `row ${index} with clipped text`
    root.append(row)
    return row
  })
  document.append(root)
  const backend = new RendererWebGpuBackend({font, invalidateGeometry() {}})
  const renderer = createDocumentRenderer({document, root, viewport: {width: 200, height: 80}, textMeasurer: backend.textMeasurer!})
  const interaction = createDocumentInteractionController({document})
  const textNodes = () => backend.root.children.filter((node): node is Text => node instanceof Text)
  try {
    const initial = renderer.flush()
    backend.applyFrame(initial)
    const retained = textNodes()
    const geometries = retained.map(node => node.stencilGeometry)
    const selection = document.getSelection()
    selection.setBaseAndExtent(rows[0]!.firstChild!, 0, rows.at(-1)!.firstChild!, 10)
    backend.applyFrame(interaction.composeFrame(initial))
    expect(backend.diagnostics.textPreparedItems).toBe(0)
    root.scrollTop = 2_000
    const scrolled = renderer.flush()
    const presentation = interaction.composeFrame(scrolled)
    backend.applyFrame(presentation)
    expect(presentation.textHighlights!.length).toBeLessThanOrEqual(5)
    expect(backend.diagnostics.textPreparedItems).toBeLessThan(12)
    expect(textNodes().every((node, index) => node === retained[index] && node.stencilGeometry === geometries[index])).toBe(true)
    const highlights = backend.root.children.filter(node => node.name === "text-highlights").flatMap(node => node.children)
    expect(highlights).toHaveLength(presentation.textHighlights!.length)
    expect(highlights.every(node => node.presentationClips.length > 0)).toBe(true)
    backend.applyFrame(interaction.composeFrame(scrolled))
    expect(backend.diagnostics.textPreparedItems).toBe(0)
  } finally {
    interaction.dispose()
    renderer.dispose()
    backend.dispose()
  }
}, 30_000)

test("подсветка остаётся под перекрывающим окном и перед исходным текстом при повторном кадре", async () => {
  const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/fonts/inter-regular.ttf", import.meta.url)).arrayBuffer())
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "display:block;width:400px;height:200px;font-size:14px;line-height:20px")
  const text = document.createElement("p")
  text.setAttribute("style", "display:block")
  text.textContent = "Текст под окном"
  const overlay = document.createElement("section")
  overlay.setAttribute("style", "display:block;position:fixed;left:30px;top:0;width:200px;height:100px;background:#222;z-index:10")
  overlay.textContent = "Переднее окно"
  root.append(text, overlay)
  document.append(root)
  for (const rectInstancing of ["safe", "disabled"] as const) {
    const backend = new RendererWebGpuBackend({font, rectInstancing, invalidateGeometry() {}})
    const renderer = createDocumentRenderer({document, root, viewport: {width:400,height:200}, textMeasurer: backend.textMeasurer!})
    const input = createDocumentInteractionController({document})
    try {
      const frame = renderer.flush()
      const range = document.createRange()
      range.selectNodeContents(text)
      document.getSelection().removeAllRanges()
      document.getSelection().addRange(range)
      for (let step = 0; step < 2; step++) {
        backend.applyFrame(input.composeFrame(frame))
        const children = backend.root.children
        const highlighted = children.findIndex(node => node.name === "text-highlights")
        const glyphs = children.findIndex(node => node instanceof Text)
        expect(highlighted).toBeGreaterThanOrEqual(0)
        expect(highlighted).toBeLessThan(glyphs)
        expect(glyphs).toBeLessThan(children.length - 1)
        expect(children.at(-1)!.name).not.toBe("text-highlights")
        if (step === 1) expect(backend.diagnostics.textPreparedItems).toBe(0)
      }
    } finally {
      input.dispose()
      renderer.dispose()
      backend.dispose()
    }
  }
})

test("единый контур рисуется над собственными фонами каждой выбранной строки", async () => {
  const font = new TrueTypeFont(await Bun.file(new URL("../../engine/static/fonts/inter-regular.ttf", import.meta.url)).arrayBuffer())
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "display:block;width:300px;height:100px;font-size:14px;line-height:20px")
  document.append(root)
  const rows = ["длинная первая строка", "короткая"].map(value => {
    const row = document.createElement("p")
    row.setAttribute("style", "display:block;height:20px;white-space:pre;background:#333")
    row.textContent = value
    root.append(row)
    return row
  })
  const renderer = createDocumentRenderer({document, root, viewport: {width:300,height:100}})
  const input = createDocumentInteractionController({document})
  const backend = new RendererWebGpuBackend({font, rectInstancing:"disabled", invalidateGeometry() {}})
  try {
    document.getSelection().setBaseAndExtent(rows[0]!.firstChild!, 0, rows[1]!.firstChild!, 8)
    const base = renderer.flush()
    const frame = input.composeFrame(base)
    expect(frame.textHighlights).toHaveLength(2)
    expect(input.composeFrame(base).textHighlights![0]!.contour).toBe(frame.textHighlights![0]!.contour)
    backend.applyFrame(frame)
    const order = backend.root.children.map(node => node.name === "text-highlights" ? "selection" : node instanceof Text ? "text" : "background")
    expect(order).toEqual(["background", "selection", "text", "background", "selection", "text"])
  } finally {
    input.dispose()
    renderer.dispose()
    backend.dispose()
  }
})
