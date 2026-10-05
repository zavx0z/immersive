import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {createDocumentInteractionController, createDocumentRenderer} from "../src/index.ts"

function fixture(value = "", width = 30, extraStyle = "", measured = false) {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "width:240px;height:240px")
  const input = document.createElement("textarea")
  input.setAttribute("style", `display:block;width:${width}px;height:80px;padding:0;border:0;font-size:10px;line-height:20px;white-space:pre-wrap;${extraStyle}`)
  input.value = value
  root.append(input)
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 240, height: 240},
    ...(measured ? {textMeasurer: {measureTextAdvance: (text: string) => Array.from(text).reduce((sum, char) => sum + (char === "W" || char === "😀" ? 12 : char === "i" ? 3 : char === "\u0301" ? 0 : 6), 0)}} : {}),
  })
  const interaction = createDocumentInteractionController({document})
  input.focus()
  const paint = () => renderer.flush().displayList.filter(item => item.node === input)
  return {document, input, renderer, interaction, paint, close() {
    interaction.dispose()
    renderer.dispose()
  }}
}

test("пустая textarea с переносами рисует каретку независимо от placeholder", () => {
  const f = fixture()
  try {
    f.input.placeholder = "Длинная подсказка"
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 0, y: 0, width: 1, height: 20})
  } finally { f.close() }
})

test("каретка и диапазон используют мягкие переносы нарисованного значения", () => {
  const f = fixture("abcdefghi")
  try {
    f.input.setSelectionRange(7, 7)
    expect(f.paint().filter(item => item.kind === "text").map(item => item.text)).toEqual(["abcde", "fghi"])
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 12, y: 20})
    f.input.setSelectionRange(3, 8)
    expect(f.paint().filter(item => item.kind === "rect").filter(item => item.key.startsWith("selection:")).map(item => [item.x, item.y, item.width]))
      .toEqual([[18, 0, 12], [0, 20, 18]])
    f.input.setSelectionRange(5, 5)
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 0, y: 20})
  } finally { f.close() }
})

test("явные и пустые строки сохраняют UTF-16 границы и маркер выбранного LF", () => {
  const f = fixture("abc\n\ndef")
  try {
    f.input.setSelectionRange(4, 4)
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 0, y: 20})
    f.input.setSelectionRange(3, 5)
    expect(f.paint().filter(item => item.kind === "rect").filter(item => item.key.startsWith("selection:")).map(item => [item.x, item.y, item.width]))
      .toEqual([[18, 0, 2], [0, 20, 2]])
  } finally { f.close() }
})

test("измеренные пропорциональные глифы определяют перенос, каретку и выбор мышью", () => {
  const f = fixture("WiWi", 24, "", true)
  try {
    const frame = f.renderer.flush()
    expect(f.paint().filter(item => item.kind === "text").map(item => item.text)).toEqual(["Wi", "Wi"])
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 15, y: 20})
    f.interaction.pointerDown(frame, {clientX: 13, clientY: 30, pointerId: 1, button: 0, buttons: 1})
    expect(f.input.selectionStart).toBe(3)
    f.interaction.pointerUp(f.renderer.flush(), {clientX: 13, clientY: 30, pointerId: 1, button: 0, buttons: 0})
  } finally { f.close() }
})

test("переносы и указатель не разделяют emoji и комбинированную графему", () => {
  const f = fixture("A😀e\u0301B", 24, "", true)
  try {
    expect(f.paint().filter(item => item.kind === "text").map(item => item.text)).toEqual(["A😀e\u0301", "B"])
    f.input.setSelectionRange(5, 5)
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 0, y: 20})
    f.interaction.pointerDown(f.renderer.flush(), {clientX: 16, clientY: 10, pointerId: 1, button: 0, buttons: 1})
    expect(f.input.selectionStart).toBe(3)
  } finally { f.close() }
})

test("прокрутка textarea сохраняет согласованные координаты каретки и выбора", () => {
  const f = fixture("abcde\nfghij\nklmno\npqrst\nuvwxy", 40, "height:40px;overflow:auto")
  try {
    f.input.setSelectionRange(18, 18)
    f.renderer.flush()
    f.input.scrollTop = 40
    const frame = f.renderer.flush()
    expect(frame.scrolls.get(f.input)?.scrollTop).toBe(40)
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 0, y: 20})
    f.interaction.pointerDown(frame, {clientX: 12, clientY: 10, pointerId: 1, button: 0, buttons: 1})
    expect(f.input.selectionStart).toBe(14)
  } finally { f.close() }
})

test("потеря фокуса и disabled убирают каретку; wrap off сохраняет прежнее поведение", () => {
  const f = fixture("abcdefghi")
  try {
    f.input.wrap = "off"
    expect(f.paint().filter(item => item.kind === "text").map(item => item.text)).toEqual(["abcdefghi"])
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 54, y: 0})
    f.input.blur()
    expect(f.paint().some(item => item.key === "caret")).toBeFalse()
    f.input.focus()
    f.input.disabled = true
    expect(f.paint().some(item => item.key === "caret")).toBeFalse()
  } finally { f.close() }
})

test("изменение ширины сохраняет значение и выделение, а геометрия следует новым строкам", () => {
  const f = fixture("abcdefghi")
  try {
    f.input.setSelectionRange(7, 7)
    const before = f.renderer.flush()
    const oldCaret = before.displayList.find(item => item.node === f.input && item.key === "caret")
    f.input.setAttribute("style", "display:block;width:18px;height:80px;padding:0;border:0;font-size:10px;line-height:20px;white-space:pre-wrap;text-align:right")
    expect(f.paint().filter(item => item.kind === "text").map(item => item.text)).toEqual(["abc", "def", "ghi"])
    expect(f.paint().find(item => item.key === "caret")).toMatchObject({x: 6, y: 40})
    expect(oldCaret).toMatchObject({x: 12, y: 20})
    expect(f.input.value).toBe("abcdefghi")
    expect(f.input.selectionStart).toBe(7)
    expect(f.document.activeElement).toBe(f.input)
  } finally { f.close() }
})
