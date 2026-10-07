import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {createDocumentInteractionController, createDocumentRenderer} from "../src/index.ts"

function fixture(value = "abcdef", width = 100, type = "text", extraStyle = "") {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "width:240px;height:100px")
  const input = document.createElement("input")
  input.type = type
  input.setAttribute("style", `display:block;width:${width}px;height:20px;padding:0;border:0;font-size:10px;line-height:20px;color:#ffffff;${extraStyle}`)
  input.value = value
  root.append(input)
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 240, height: 100},
    textMeasurer: {measureTextAdvance: (text: string) => Array.from(text).reduce((sum, char) =>
      sum + (char === "W" || char === "😀" ? 12 : char === "i" ? 3 : char === "\u0301" ? 0 : 6), 0)},
  })
  const interaction = createDocumentInteractionController({document})
  const paint = () => renderer.flush().displayList.filter(item => item.node === input)
  const caret = () => paint().find(item => item.kind === "rect" && item.key === "caret")
  const pointer = (x: number, extra = {}) => ({clientX: x, clientY: 10, pointerId: 1, button: 0, buttons: 1, ...extra})
  return {document, root, input, renderer, interaction, paint, caret, pointer, close() {
    interaction.dispose()
    renderer.dispose()
  }}
}

test("пустое поле рисует каретку у значения, независимо от placeholder", () => {
  const f = fixture("")
  try {
    expect(f.caret()).toBeUndefined()
    f.input.placeholder = "Подсказка"
    f.input.focus()
    expect(f.caret()).toMatchObject({x: 0, y: 0, width: 1, height: 20, color: "#ffffff"})
    f.input.blur()
    expect(f.caret()).toBeUndefined()
  } finally {f.close()}
})

test("URL selection и select используют измеренные пропорциональные глифы", () => {
  const f = fixture("WiWi", 100, "url")
  try {
    f.input.focus()
    f.input.setSelectionRange(2, 2)
    expect(f.caret()).toMatchObject({x: 15})
    f.input.setSelectionRange(1, 3, "backward")
    expect(f.paint().find(item => item.key === "selection:0")).toMatchObject({x: 12, width: 15, height: 20})
    expect(f.caret()).toBeUndefined()
    f.input.select()
    expect(f.paint().find(item => item.key === "selection:0")).toMatchObject({x: 0, width: 30})
  } finally {f.close()}
})

test("позиция selection обновляет paint и hit без повторного layout и изменения старого кадра", () => {
  const f = fixture()
  try {
    f.input.focus()
    f.input.setSelectionRange(1, 1)
    const before = f.renderer.flush()
    f.input.setSelectionRange(3, 3)
    const after = f.renderer.flush()
    expect(after.boxes).toBe(before.boxes)
    expect(after.boxByNode).toBe(before.boxByNode)
    expect(after.hitOrder?.find(hit => hit.node === f.input)).toBe(after.hits.get(f.input))
    expect(before.displayList.find(item => item.key === "caret")).toMatchObject({x: 6})
    expect(after.displayList.find(item => item.key === "caret")).toMatchObject({x: 18})
    f.input.value = "Wi"
    f.input.setSelectionRange(2, 2)
    expect(f.caret()).toMatchObject({x: 15})
    expect(f.renderer.flush().hits.get(f.input)?.textControl?.lines?.[0]?.text).toBe("Wi")
    f.input.setAttribute("style", "display:block;width:100px;height:20px;padding:0;border:0;font-size:10px;line-height:20px;transform:translate(20px,0px);transform-origin:0 0")
    const transformed = f.renderer.flush()
    expect(transformed.hitOrder?.find(hit => hit.node === f.input)).toBe(transformed.hits.get(f.input))
    f.interaction.pointerDown(transformed, f.pointer(32))
    expect(f.document.activeElement).toBe(f.input)
    expect(f.input.selectionStart).toBe(1)
  } finally {f.close()}
})

test("активная длинная строка сохраняет весь текст и показывает позицию ввода внутри clip", () => {
  const f = fixture("abcdef", 24)
  try {
    f.input.focus()
    f.input.setSelectionRange(6, 6)
    expect(f.caret()).toMatchObject({x: 23, width: 1})
    const value = f.paint().find(item => item.kind === "text" && item.key === "value")!
    expect(value).toMatchObject({text: "abcdef", x: -13})
    expect(value.clips.at(-1)).toMatchObject({x: 0, width: 24, clipX: true, clipY: true})
    f.interaction.pointerDown(f.renderer.flush(), f.pointer(5))
    expect(f.input.selectionStart).toBe(3)
    f.interaction.pointerUp(f.renderer.flush(), f.pointer(5, {buttons: 0}))
    f.input.setSelectionRange(0, 0)
    expect(f.caret()).toMatchObject({x: 0})
  } finally {f.close()}
})

test("пароль сопоставляет одну маску графемы с исходными UTF-16 границами", () => {
  const f = fixture("A😀e\u0301B", 100, "password")
  try {
    f.input.focus()
    f.input.setSelectionRange(3, 3)
    expect(f.caret()).toMatchObject({x: 12})
    expect(f.paint().find(item => item.kind === "text")).toMatchObject({text: "••••"})
    f.input.setSelectionRange(1, 5)
    expect(f.paint().find(item => item.key === "selection:0")).toMatchObject({x: 6, width: 12})
    f.interaction.pointerDown(f.renderer.flush(), f.pointer(11))
    expect(f.input.selectionStart).toBe(3)
    expect(f.renderer.flush().hits.get(f.input)?.textControl?.lines?.[0]?.source?.offsets).toEqual([0, 1, 3, 5, 6])
  } finally {f.close()}
})

test("клик, drag и shift-click сохраняют графемы и направление selection", () => {
  const f = fixture("A😀e\u0301B")
  try {
    f.interaction.pointerDown(f.renderer.flush(), f.pointer(16))
    expect(f.input.selectionStart).toBe(3)
    f.interaction.pointerMove(f.renderer.flush(), f.pointer(3))
    expect([f.input.selectionStart, f.input.selectionEnd, f.input.selectionDirection]).toEqual([0, 3, "backward"])
    f.interaction.pointerUp(f.renderer.flush(), f.pointer(3, {buttons: 0}))
    f.interaction.pointerDown(f.renderer.flush(), f.pointer(29, {shiftKey: true}))
    expect([f.input.selectionStart, f.input.selectionEnd]).toEqual([3, 6])
    f.interaction.pointerUp(f.renderer.flush(), f.pointer(29, {buttons: 0}))
    f.input.addEventListener("pointerdown", event => event.preventDefault())
    f.interaction.pointerDown(f.renderer.flush(), f.pointer(0))
    expect([f.input.selectionStart, f.input.selectionEnd]).toEqual([3, 6])
  } finally {f.close()}
})

test("readonly и disabled не рисуют editing caret, выделение readonly остаётся доступным", () => {
  const f = fixture()
  try {
    f.input.focus()
    f.input.readOnly = true
    expect(f.caret()).toBeUndefined()
    f.input.select()
    expect(f.paint().some(item => item.key === "selection:0")).toBe(true)
    f.input.disabled = true
    expect(f.paint().some(item => item.key.startsWith("selection:") || item.key === "caret")).toBe(false)
  } finally {f.close()}
})

test("тип без value-based selection не получает ложной каретки", () => {
  const f = fixture("12", 100, "number")
  try {
    f.input.focus()
    expect(f.input.selectionStart).toBeNull()
    expect(f.caret()).toBeUndefined()
    expect(f.paint().find(item => item.kind === "text")).toMatchObject({text: "12"})
  } finally {f.close()}
})


test("clip, каретка и указатель следуют transform владельца при retained обновлении", () => {
  const f = fixture("abcdef", 100)
  try {
    const parent = f.document.createElement("div")
    parent.setAttribute("style", "width:120px;height:40px;transform:translate(10px,0px) scale(2);transform-origin:0 0")
    f.root.append(parent)
    parent.append(f.input)
    f.input.focus()
    f.input.setSelectionRange(2, 2)
    f.renderer.flush()
    parent.setAttribute("style", "width:120px;height:40px;transform:translate(20px,0px) scale(1);transform-origin:0 0")
    const frame = f.renderer.flush()
    const caret = f.caret()!
    expect(caret.transform).toEqual(frame.presentationTransforms?.get(parent)!)
    expect(caret.clips.at(-1)?.presentationOwner).toBe(parent)
    expect(caret.clips.at(-1)?.x).toBe(frame.boxByNode.get(f.input)?.contentX)
    f.interaction.pointerDown(frame, f.pointer(38))
    expect(f.input.selectionStart).toBe(3)
  } finally {f.close()}
})
