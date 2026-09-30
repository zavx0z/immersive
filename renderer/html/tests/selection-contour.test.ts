import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/dom"
import {caretPositionAtPoint, createDocumentInteractionController, createDocumentRenderer, getRangeClientRects} from "../src/index.ts"

/** Настоящие inline-фрагменты и соседние строки без отдельного редакторского выделения. */
function fixture() {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "display:block;width:500px;height:240px;font-size:10px;line-height:20px")
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 500, height: 240}})
  const input = createDocumentInteractionController({document})
  const line = (parts: readonly string[]) => {
    const row = document.createElement("div")
    row.setAttribute("style", "display:block;height:20px;white-space:pre")
    for (const text of parts) {
      const span = document.createElement("span")
      span.textContent = text
      row.append(span)
    }
    root.append(row)
    return row
  }
  return {document, root, renderer, input, line, dispose() {
    input.dispose()
    renderer.dispose()
  }}
}

test("выделение объединяет токены и смежные строки в один скруглённый контур", () => {
  const f = fixture()
  try {
    const first = f.line(["    prompt: ", '"Исправь подпись",'])
    const middle = f.line(["  model: ", '"gpt-5.6-sol",'])
    const last = f.line(["})"])
    const frame = f.renderer.flush()
    f.document.getSelection().setBaseAndExtent(first.lastChild!.firstChild!, 0, last.firstChild!.firstChild!, 2)
    const range = f.document.getSelection().getRangeAt(0)
    expect(getRangeClientRects(frame, range)).toHaveLength(4)
    const selected = f.input.composeFrame(frame)
    expect(selected.displayList).toBe(frame.displayList)
    expect(selected.textHighlights).toHaveLength(3)
    const highlight = selected.textHighlights![0]!
    expect(selected.textHighlights!.map(item => [item.y, item.height])).toEqual([[0, 20], [20, 20], [40, 20]])
    expect(highlight.contour!.segments.length).toBeGreaterThan(12)
    expect(highlight.contour!.segments.every(edge => Number.isFinite(edge.from.x) && Number.isFinite(edge.to.y))).toBe(true)
    expect(highlight.contour!.segments.some(edge => edge.from.x !== edge.to.x && edge.from.y !== edge.to.y)).toBe(true)
    expect(highlight.paintBefore?.node).toBe(first.lastChild!.firstChild!)
    expect(f.document.getSelection().toString()).toContain(middle.textContent)
  } finally { f.dispose() }
})

test("одна строка не имеет швов на границах синтаксических токенов", () => {
  const f = fixture()
  try {
    const row = f.line(["model: ", '"gpt-5.6-sol"', ","])
    const range = f.document.createRange()
    range.selectNodeContents(row)
    f.document.getSelection().addRange(range)
    const frame = f.renderer.flush()
    const selected = f.input.composeFrame(frame)
    expect(selected.textHighlights).toHaveLength(1)
    expect(selected.textHighlights![0]!.width).toBeCloseTo(row.textContent.length * 6)
    expect(selected.textHighlights![0]!.border.radii.topLeft).toBe(4)
  } finally { f.dispose() }
})

test("поиск ближайшего текста в непрозрачном окне не выбирает закрытую фоновую строку", () => {
  const f = fixture()
  try {
    f.line(["Фоновый текст ".repeat(20)])
    const window = f.document.createElement("section")
    window.setAttribute("style", "display:block;position:fixed;left:0;top:0;width:300px;height:180px;background:#222;z-index:10")
    const text = f.document.createElement("p")
    text.setAttribute("style", "margin-top:60px")
    text.textContent = "Текст окна"
    window.append(text)
    f.root.append(window)
    const frame = f.renderer.flush()
    const caret = caretPositionAtPoint(frame, 20, 10, {nearest: true})
    expect(caret?.offsetNode).toBe(text.firstChild!)
    f.input.pointerDown(frame, {clientX: 20, clientY: 10})
    f.input.pointerMove(frame, {clientX: 60, clientY: 70, buttons: 1})
    expect(window.contains(f.document.getSelection().anchorNode)).toBe(true)
    expect(window.contains(f.document.getSelection().focusNode)).toBe(true)
  } finally { f.dispose() }
})

test("пустая выбранная строка не разрывает многострочное выделение", () => {
  const f = fixture()
  try {
    const first = f.line(["первая строка"])
    f.line([])
    const last = f.line(["последняя строка"])
    f.document.getSelection().setBaseAndExtent(first.firstChild!.firstChild!, 0, last.firstChild!.firstChild!, 8)
    const frame = f.input.composeFrame(f.renderer.flush())
    expect(frame.textHighlights).toHaveLength(3)
    expect(frame.textHighlights!.map(item => [item.y, item.height])).toEqual([[0, 20], [20, 20], [40, 20]])
    expect(frame.textHighlights![0]!.contour).toBeDefined()
  } finally { f.dispose() }
})

test("plain Text между цветными span не разрывает подсветку строки кода", () => {
  const f = fixture()
  try {
    const row = f.line([])
    const property = f.document.createElement("span")
    property.setAttribute("style", "display:inline;color:#ff00ff")
    property.textContent = '"path"'
    const value = f.document.createElement("span")
    value.setAttribute("style", "display:inline;color:#00ff00")
    value.textContent = '"immersive/nodes/node/diagram"'
    row.append("  ", property, ": ", value)
    const range = f.document.createRange()
    range.selectNodeContents(row)
    f.document.getSelection().addRange(range)
    const frame = f.input.composeFrame(f.renderer.flush())
    expect(frame.textHighlights).toHaveLength(1)
    expect(frame.textHighlights![0]!.width).toBeCloseTo(row.textContent.length * 6)
  } finally { f.dispose() }
})
