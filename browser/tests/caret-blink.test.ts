import {expect, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {createDocumentInteractionController, createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import {readCanonicalRenderFrameChanges} from "@zavx0z/immersive-renderer-html/frame-changes"
import {createDocumentCaretBlink} from "../src/caret-blink.ts"

function fixture() {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "width:240px;height:100px")
  document.append(root)
  const input = document.createElement("input")
  input.setAttribute("style", "width:100px;height:20px;padding:0;border:0;font-size:10px;line-height:20px")
  input.value = "abcdef"
  root.append(input)
  let now = 0
  let sequence = 0
  const timers = new Map<number, {at: number; callback(): void}>()
  let requests = 0
  const blink = createDocumentCaretBlink({document, owns: node => root.contains(node), requestFrame() {requests++},
    setTimer(callback, delay) {const id = ++sequence; timers.set(id, {at: now + delay, callback}); return id},
    clearTimer(handle) {timers.delete(handle as number)},
  })
  const renderer = createDocumentRenderer({document, root, viewport: {width: 240, height: 100}})
  const interaction = createDocumentInteractionController({document, caretVisible: () => blink.visible})
  const compose = () => interaction.composeFrame(renderer.flush(), now)
  const advance = (time: number) => {
    const until = now + time
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      now = next[1].at
      timers.delete(next[0])
      next[1].callback()
    }
    now = until
  }
  return {document, root, input, blink, renderer, interaction, compose, advance, timers,
    get requests() {return requests}, close() {blink.dispose(); interaction.dispose(); renderer.dispose()},
  }
}

test("один таймер мигает через demand frame и сохраняет layout, hit и предыдущий paint", () => {
  const f = fixture()
  try {
    f.input.focus()
    f.input.setSelectionRange(3, 3)
    f.blink.synchronize()
    const before = f.compose()
    const index = before.displayList.findIndex(item => item.key === "caret")
    expect(before.displayList[index]?.opacity).toBe(1)
    expect(f.timers.size).toBe(1)
    f.advance(499)
    expect(f.requests).toBe(0)
    f.advance(1)
    const off = f.compose()
    expect(f.requests).toBe(1)
    expect(off.displayList[index]?.opacity).toBe(0)
    expect(off.boxes).toBe(before.boxes)
    expect(off.hits).toBe(before.hits)
    expect(readCanonicalRenderFrameChanges(off)?.indexes).toContain(index)
    f.advance(500)
    const on = f.compose()
    expect(on.displayList[index]?.opacity).toBe(1)
    expect(readCanonicalRenderFrameChanges(on)?.indexes).toContain(index)
    expect(before.displayList[index]?.opacity).toBe(1)
    expect(off.displayList[index]?.opacity).toBe(0)
    expect(f.timers.size).toBe(1)
  } finally {f.close()}
  expect(f.timers.size).toBe(0)
})

test("ввод и изменение позиции восстанавливают видимую фазу, диапазон и blur отменяют таймер", () => {
  const f = fixture()
  try {
    f.input.focus()
    f.input.setSelectionRange(2, 2)
    f.blink.synchronize()
    f.advance(500)
    expect(f.blink.visible).toBe(false)
    f.input.value = "abXcdef"
    f.input.setSelectionRange(3, 3)
    expect(f.blink.visible).toBe(true)
    f.advance(499)
    expect(f.blink.visible).toBe(true)
    f.advance(1)
    expect(f.blink.visible).toBe(false)
    f.input.setSelectionRange(1, 5)
    expect(f.timers.size).toBe(0)
    expect(f.compose().displayList.some(item => item.key === "caret")).toBe(false)
    f.input.setSelectionRange(5, 5)
    expect(f.timers.size).toBe(1)
    f.input.blur()
    expect(f.timers.size).toBe(0)
  } finally {f.close()}
})

test("disabled, readonly и удаление поля не оставляют таймеров после смены владельца", () => {
  const f = fixture()
  try {
    f.input.focus()
    f.blink.synchronize()
    f.input.readOnly = true
    expect(f.timers.size).toBe(0)
    f.input.readOnly = false
    expect(f.timers.size).toBe(1)
    f.input.disabled = true
    expect(f.timers.size).toBe(0)
    f.input.disabled = false
    f.input.focus()
    f.blink.synchronize()
    expect(f.timers.size).toBe(1)
    f.input.remove()
    expect(f.timers.size).toBe(0)
    f.advance(2000)
    expect(f.requests).toBe(0)
  } finally {f.close()}
})
