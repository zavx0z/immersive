import {expect, test} from "bun:test"
import {createDocument, HTMLElement} from "@zavx0z/immersive-dom"
import {createDocumentInteractionController, createDocumentRenderer, hitTestProjection} from "../src/index.ts"
import {projectionPaintIndex} from "../src/projection-hit.ts"

const fixture = () => {
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "position: relative; width: 200px; height: 200px")
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 200, height: 200}})
  const add = (style: string, tag: "div" | "button" = "div") => {
    const node = document.createElement(tag)
    node.setAttribute("style", style)
    root.append(node)
    return node
  }
  const hit = (x: number, y: number) => hitTestProjection(renderer.flush(), x, y)?.node ?? null
  return {document, root, renderer, add, hit}
}

test("scroll retains paint ownership while hit coordinates follow the new frame", () => {
  const f = fixture()
  const scroll = f.add("width:100px;height:50px;overflow:auto")
  const first = f.document.createElement("div")
  first.setAttribute("style", "width:100px;height:50px;background:#ff0000")
  const second = f.document.createElement("div")
  second.setAttribute("style", "width:100px;height:50px;background:#0000ff")
  scroll.append(first, second)
  try {
    const before = f.renderer.flush()
    const index = projectionPaintIndex(before)
    expect(hitTestProjection(before, 20, 20)?.node).toBe(first)
    scroll.scrollTop = 50
    const after = f.renderer.flush()
    expect(projectionPaintIndex(after)).toBe(index)
    expect(hitTestProjection(after, 20, 20)?.node).toBe(second)
    expect(hitTestProjection(before, 20, 20)?.node).toBe(first)
    first.setAttribute("style", "width:100px;height:50px;background:transparent")
    scroll.scrollTop = 0
    const changed = f.renderer.flush()
    expect(projectionPaintIndex(changed)).not.toBe(index)
    expect(hitTestProjection(changed, 20, 20)?.node).toBe(scroll)
  } finally { f.renderer.dispose() }
})

test("empty projection wrappers pass input while a passive painted panel occludes it", () => {
  const f = fixture()
  const wrapper = f.add("width: 200px; height: 200px")
  expect(f.hit(100, 100)).toBeNull()
  wrapper.setAttribute("style", "width: 50px; height: 50px; background: #333")
  expect(f.hit(20, 20)).toBe(wrapper)
  expect(f.hit(100, 100)).toBeNull()
  f.renderer.dispose()
})

test("a border-only frame owns its border without masking its empty center", () => {
  const f = fixture()
  const frame = f.add("box-sizing: border-box; width: 100px; height: 100px; border: 2px solid #fff")
  expect(f.hit(1, 50)).toBe(frame)
  expect(f.hit(50, 1)).toBe(frame)
  expect(f.hit(99, 50)).toBe(frame)
  expect(f.hit(50, 99)).toBe(frame)
  expect(f.hit(50, 50)).toBeNull()
  f.renderer.dispose()
})

test("transparent and disabled controls retain input ownership and exact bubbling", () => {
  const f = fixture()
  const button = f.add("width: 80px; height: 40px; background: transparent; border: 0", "button")
  const span = f.document.createElement("span")
  span.append("Go")
  button.append(span)
  const interaction = createDocumentInteractionController({document: f.document, hitTest: hitTestProjection})
  const clicked: unknown[] = []
  button.addEventListener("click", event => clicked.push(event.target))
  const frame = f.renderer.flush()
  interaction.pointerDown(frame, {clientX: 10, clientY: 10, pointerId: 1})
  interaction.pointerUp(frame, {clientX: 10, clientY: 10, pointerId: 1})
  expect(clicked.length).toBe(1)
  expect(button.contains(clicked[0] as never)).toBe(true)
  button.setAttribute("disabled", "")
  expect(f.hit(70, 30)).toBe(button)
  interaction.pointerDown(f.renderer.flush(), {clientX: 70, clientY: 30, pointerId: 2})
  interaction.pointerUp(f.renderer.flush(), {clientX: 70, clientY: 30, pointerId: 2})
  expect(clicked.length).toBe(1)
  interaction.dispose()
  f.renderer.dispose()
})

test("scroll viewport owns wheel at its limit without leaking to another projection", () => {
  const f = fixture()
  const scroll = f.add("width: 100px; height: 50px; overflow: auto")
  const content = f.document.createElement("div")
  content.setAttribute("style", "width: 100px; height: 200px")
  scroll.append(content)
  expect(f.hit(20, 20)).toBe(scroll)
  const interaction = createDocumentInteractionController({document: f.document, hitTest: hitTestProjection})
  interaction.wheel(f.renderer.flush(), {clientX: 20, clientY: 20, deltaY: 500})
  expect(scroll.scrollTop).toBe(150)
  expect(f.hit(20, 20)).toBe(scroll)
  interaction.dispose()
  f.renderer.dispose()
})

test("transformed clipped content owns only the presented region", () => {
  const f = fixture()
  const clip = f.add("width: 40px; height: 40px; overflow: clip; transform: translate(50px, 50px)")
  const child = f.document.createElement("div")
  child.setAttribute("style", "width: 100px; height: 100px; background: #fff")
  clip.append(child)
  expect(f.hit(60, 60)).toBe(child)
  expect(f.hit(95, 60)).toBeNull()
  expect(f.hit(10, 10)).toBeNull()
  f.renderer.dispose()
})

test("transparent siblings do not steal a lower element's pointer target", () => {
  const f = fixture()
  const lower = f.add("position: absolute; width: 80px; height: 40px; background: #333")
  f.add("position: absolute; width: 200px; height: 200px; background: rgba(0, 0, 0, 0)")
  expect(f.hit(10, 10)).toBe(lower)
  expect(f.hit(100, 100)).toBeNull()
  f.renderer.dispose()
})

test("negative tabindex owns the transparent row without entering sequential focus order", () => {
  const f = fixture()
  const scroll = f.add("width:180px;height:60px;overflow:auto")
  const row = f.document.createElement("div")
  row.setAttribute("role", "treeitem")
  row.setAttribute("tabindex", "-1")
  row.setAttribute("style", "width:180px;height:24px;background:transparent")
  row.textContent = "Short"
  const sibling = f.document.createElement("div")
  sibling.setAttribute("tabindex", "0")
  sibling.setAttribute("style", "width:180px;height:100px")
  scroll.append(row, sibling)
  const interaction = createDocumentInteractionController({document: f.document, hitTest: hitTestProjection})
  const clicked: unknown[] = []
  row.addEventListener("click", event => clicked.push(event.target))
  try {
    const frame = f.renderer.flush()
    expect(hitTestProjection(frame, 150, 12)?.node).toBe(row)
    interaction.pointerDown(frame, {clientX: 150, clientY: 12, pointerId: 1})
    interaction.pointerUp(f.renderer.flush(), {clientX: 150, clientY: 12, pointerId: 1})
    expect(clicked).toEqual([row])
    expect(f.document.activeElement).toBe(row)
    expect(row.tabIndex).toBe(-1)
    expect([...scroll.querySelectorAll("[tabindex]")].filter(node => node instanceof HTMLElement && node.tabIndex >= 0)).toEqual([sibling])
    row.setAttribute("disabled", "")
    const disabled = f.renderer.flush()
    expect(hitTestProjection(disabled, 150, 12)?.node).toBe(row)
    interaction.pointerDown(disabled, {clientX: 150, clientY: 12, pointerId: 2})
    interaction.pointerUp(disabled, {clientX: 150, clientY: 12, pointerId: 2})
    expect(clicked).toEqual([row])
  } finally {
    interaction.dispose()
    f.renderer.dispose()
  }
})

test.each(["", "invalid", "+", "--1", "2147483648", "-2147483649"])(
  "invalid tabindex %j does not turn an empty wrapper into an input blocker", value => {
    const f = fixture()
    const lower = f.add("position:absolute;width:180px;height:60px;background:#333")
    const wrapper = f.add("position:absolute;width:180px;height:60px;background:transparent")
    wrapper.setAttribute("tabindex", value)
    try {
      expect(f.hit(150, 12)).toBe(lower)
      expect(f.renderer.flush().hits.get(wrapper)?.interactive).toBe(false)
    } finally { f.renderer.dispose() }
  },
)

test.each(["-1", "\t -2", "+0", "12suffix", "-2147483648", "2147483647"])(
  "valid HTML tabindex %j retains transparent input ownership", value => {
    const f = fixture()
    const control = f.add("width:180px;height:24px;background:transparent")
    control.setAttribute("tabindex", value)
    try { expect(f.hit(150, 12)).toBe(control) }
    finally { f.renderer.dispose() }
  },
)
