import {expect, test} from "bun:test"
import {createDocument} from "@immersive/dom"
import {caretPositionAtPoint, createDocumentRenderer, getRangeClientRects, readRenderedSelectionText} from "../src/index.ts"

function fixture(text: string, style = "width:40px;white-space:pre-wrap") {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "width:200px;font-size:10px;line-height:14px")
  const paragraph = document.createElement("p")
  paragraph.setAttribute("style", style)
  paragraph.textContent = text
  root.append(paragraph)
  document.append(root)
  const options = {document, root, viewport: {width: 200, height: 600},
    textMeasurer: {measureTextAdvance: (value: string) => value.length * 5}}
  const renderer = createDocumentRenderer(options)
  return {document, root, paragraph, renderer, options}
}

test("pre-wrap сохраняет пробелы и явные строки, переносит слова и сохраняет DOM offsets", () => {
  const source = "alpha  beta\n gamma"
  const f = fixture(source)
  try {
    const frame = f.renderer.flush()
    const runs = frame.displayList.filter(item => item.kind === "text")
    expect(runs.map(item => item.text)).toEqual(["alpha  ", "beta", " gamma"])
    expect(runs.map(item => item.y)).toEqual([0, 14, 28])
    expect(f.paragraph.getBoundingClientRect().height).toBe(42)
    const range = f.document.createRange()
    range.selectNodeContents(f.paragraph)
    expect(readRenderedSelectionText(frame, range)).toBe(source)
    range.setStart(f.paragraph.firstChild!, 7)
    range.setEnd(f.paragraph.firstChild!, 11)
    expect(getRangeClientRects(frame, range).map(rect => [rect.x, rect.y, rect.width])).toEqual([[0, 14, 20]])
    expect(caretPositionAtPoint(frame, 1, 21)).toEqual({offsetNode: f.paragraph.firstChild!, offset: 7})
    expect(f.paragraph.textContent).toBe(source)
  } finally { f.renderer.dispose() }
})

test("fit-content и процентный max-width измеряют высоту pre-wrap после ограничения ширины", () => {
  const f = fixture("Длинное сообщение с переносом слов. ".repeat(20),
    "width:fit-content;max-width:90%;min-width:0;box-sizing:border-box;padding:10px 14px;white-space:pre-wrap;overflow-wrap:anywhere")
  f.root.setAttribute("style", "display:flex;flex-direction:column;width:200px;font-size:10px;line-height:14px")
  try {
    const rect = f.paragraph.getBoundingClientRect()
    expect(rect.width).toBeLessThanOrEqual(180)
    expect(rect.height).toBeGreaterThan(60)
  } finally { f.renderer.dispose() }
})

test("переключение pre и pre-wrap, изменение текста и ширины сохраняют равенство свежей раскладке", () => {
  const f = fixture("alpha beta gamma", "width:50px;height:80px;white-space:pre")
  const text = f.paragraph.firstChild!
  const runs = () => f.renderer.flush().displayList.filter(item => item.kind === "text")
  try {
    expect(runs()).toHaveLength(1)
    f.paragraph.setAttribute("style", "width:50px;height:80px;white-space:pre-wrap")
    expect(runs().length).toBeGreaterThan(1)
    text.textContent = "alpha beta gamma delta epsilon"
    f.paragraph.setAttribute("style", "width:35px;height:80px;white-space:pre-wrap")
    const retained = runs().map(item => [item.text, item.x, item.y, item.width])
    const fresh = createDocumentRenderer({...f.options, registerGeometry: false})
    try {
      expect(retained).toEqual(fresh.flush().displayList.filter(item => item.kind === "text").map(item => [item.text, item.x, item.y, item.width]))
    } finally { fresh.dispose() }
    expect(f.paragraph.firstChild).toBe(text)
  } finally { f.renderer.dispose() }
})

test("overflow-wrap наследуется, anywhere влияет на min-content, break-word сохраняет его", () => {
  const f = fixture("abcdefghij", "width:50px")
  f.root.setAttribute("style", "width:200px;font-size:10px;line-height:14px;overflow-wrap:anywhere")
  try {
    f.paragraph.setAttribute("style", "width:20px")
    expect(f.paragraph.getBoundingClientRect().height).toBe(42)
    f.paragraph.setAttribute("style", "width:min-content")
    expect(f.paragraph.getBoundingClientRect().width).toBe(5)
    f.paragraph.setAttribute("style", "width:min-content;overflow-wrap:break-word")
    expect(f.paragraph.getBoundingClientRect().width).toBe(50)
    f.paragraph.setAttribute("style", "width:20px;white-space:nowrap;overflow-wrap:anywhere")
    expect(f.paragraph.getBoundingClientRect().height).toBe(14)
  } finally { f.renderer.dispose() }
})


test("word-wrap сохраняет порядок каскада и CSS-wide значения наследуемого overflow-wrap", () => {
  const f = fixture("abcdefghij", "width:20px")
  f.root.setAttribute("style", "width:200px;font-size:10px;line-height:14px;white-space:pre-wrap;overflow-wrap:anywhere")
  try {
    expect(f.paragraph.getBoundingClientRect().height).toBe(42)
    f.paragraph.setAttribute("style", "width:20px;word-wrap:initial")
    expect(f.paragraph.getBoundingClientRect().height).toBe(14)
    f.paragraph.setAttribute("style", "width:20px;word-wrap:unset;white-space:inherit")
    expect(f.paragraph.getBoundingClientRect().height).toBe(42)
    f.paragraph.setAttribute("style", "width:20px;overflow-wrap:anywhere;word-wrap:normal")
    expect(f.paragraph.getBoundingClientRect().height).toBe(14)
    f.paragraph.setAttribute("style", "width:20px;word-wrap:normal;overflow-wrap:anywhere")
    expect(f.paragraph.getBoundingClientRect().height).toBe(42)
  } finally { f.renderer.dispose() }
})
