import {expect, test} from "bun:test"
import {createDocument, Node} from "@zavx0z/immersive-dom"
import {createDocumentRenderer, getRangeClientRects, hitTestProjection, type RenderClip, type RenderFrame} from "../src/index.ts"
import {readCanonicalRenderFrameChanges} from "../src/frame-changes.ts"

function fixture(extraRules = "", count = 12) {
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "position:relative;width:320px;height:220px;overflow:hidden;transform:translate(8px,6px);transform-origin:0 0")
  document.append(root)
  const surface = document.createElement("div")
  surface.className = "surface"
  const move = (x: number, y = 0) => surface.setAttribute("style", `--offset-x:${x}px;--offset-y:${y}px`)
  move(0)
  const content = document.createElement("div")
  content.className = "content"
  const rows = Array.from({length: count}, (_, index) => {
    const row = document.createElement("div")
    row.className = "row"
    row.textContent = `Строка ${index}: сохранённый текст`
    content.append(row)
    return row
  })
  surface.append(content)
  root.append(surface)
  let measurements = 0
  const styleSheets = [`.surface {
    position:absolute;left:0;top:0;width:180px;height:100px;overflow:auto;border-radius:8px;
    transform:translate(var(--offset-x),var(--offset-y));transform-origin:0 0;
  }
  .row { height:20px;line-height:20px;color:var(--tone,#abcdef);background:#243344 }
  ${extraRules}`]
  const options = {document, root, viewport: {width: 320, height: 220}, styleSheets}
  const renderer = createDocumentRenderer({...options, textMeasurer: {measureTextAdvance(text) {
    measurements++
    return text.length * 6
  }}})
  const range = document.createRange()
  range.setStart(rows[2]!.firstChild!, 0)
  range.setEnd(rows[2]!.firstChild!, 6)
  const ids = new WeakMap<Node, number>()
  let nextId = 0
  const normalize = (value: unknown, frame: RenderFrame) => JSON.parse(JSON.stringify(value, (key, item) => {
    if (key === "clips" && Array.isArray(item)) return item.map((clip: RenderClip) => ({
      ...clip,
      transform: clip.presentationOwner == null ? clip.transform : frame.presentationTransforms?.get(clip.presentationOwner) ?? clip.transform,
    }))
    if (item instanceof Node) {
      if (!ids.has(item)) ids.set(item, nextId++)
      return ids.get(item)
    }
    return typeof item === "number" ? Math.round(item * 1e7) / 1e7 : item
  }))
  const snapshot = (frame: RenderFrame) => normalize({
    boxes: [...frame.boxes], display: [...frame.displayList], hits: [...frame.hits],
    hitOrder: frame.hitOrder, scrolls: [...frame.scrolls], transforms: [...frame.presentationTransforms ?? []],
    selection: getRangeClientRects(frame, range),
  }, frame)
  const compareFresh = (frame: RenderFrame) => {
    const reference = createDocumentRenderer({...options, registerGeometry: false,
      textMeasurer: {measureTextAdvance: text => text.length * 6}})
    try {
      const fresh = reference.flush()
      expect(snapshot(frame), "Frame, clips, scroll и selection должны совпадать с полным rebuild").toEqual(snapshot(fresh))
      for (const [x, y] of [[10, 10], [40, 35], [140, 75], [195, 110], [300, 180]]) {
        expect(hitTestProjection(frame, x!, y!)?.node, "Hit geometry должна соответствовать полному rebuild").toBe(hitTestProjection(fresh, x!, y!)?.node)
      }
    } finally {
      reference.dispose()
    }
  }
  return {document, root, surface, content, rows, renderer, range, move, snapshot, compareFresh,
    resetMeasurements: () => { measurements = 0 }, measured: () => measurements}
}

test("Custom properties только владельческого transform сохраняют layout без text measurement, clips, selection и scroll", () => {
  const f = fixture()
  try {
    f.renderer.flush()
    f.surface.scrollTop = 20
    let previous = f.renderer.flush()
    for (const [x, y] of [[20, 10], [-6, 14], [35, 0], [0, 0]]) {
      const old = f.snapshot(previous)
      f.resetMeasurements()
      f.move(x!, y!)
      const frame = f.renderer.flush()
      expect(f.measured(), "Transform-only custom properties не должны заново измерять текст").toBe(0)
      expect(readCanonicalRenderFrameChanges(frame)?.previous, "Изменение публикуется обычным canonical transform delta").toBe(previous)
      expect(f.snapshot(previous), "Предыдущий immutable frame не изменяется").toEqual(old)
      f.compareFresh(frame)
      previous = frame
    }
  } finally {
    f.renderer.dispose()
  }
})

test.each([
  ".row { --alias:var(--offset-x);width:var(--alias) }",
  ".row { color:var(--missing,var(--offset-x)) }",
  ".row { --first:var(--second);--second:var(--offset-x);padding-left:var(--first) }",
  ".row { transform:translate(var(--offset-x),0px) }",
  ".row { --first:var(--second);--second:var(--first,var(--offset-x));width:var(--first,30px) }",
  ".surface { width:var(--offset-x) }",
])("Зависимость custom property в геометрии, цвете, fallback или transform потомка требует полного cascade: %s", rules => {
  const f = fixture(rules)
  try {
    f.renderer.flush()
    f.move(40)
    const frame = f.renderer.flush()
    expect(readCanonicalRenderFrameChanges(frame), "Неоднозначная var-зависимость запрещает transform-only delta").toBeNull()
    f.compareFresh(frame)
  } finally {
    f.renderer.dispose()
  }
})

test("Скрытый потомок сохраняет var dependency через fallback до появления LayoutNode", () => {
  const f = fixture()
  const hidden = f.document.createElement("div")
  hidden.setAttribute("style", "display:none")
  const child = f.document.createElement("div")
  child.setAttribute("style", "width:var(--missing,var(--offset-x))")
  hidden.append(child)
  f.content.append(hidden)
  try {
    f.renderer.flush()
    f.move(40)
    const frame = f.renderer.flush()
    expect(readCanonicalRenderFrameChanges(frame), "Скрытая зависимость также требует обычного cascade").toBeNull()
    f.compareFresh(frame)
    hidden.setAttribute("style", "display:block")
    const visible = f.renderer.flush()
    expect(visible.boxByNode.get(child)?.width, "После появления используется последнее значение переменной").toBe(40)
    f.compareFresh(visible)
  } finally {
    f.renderer.dispose()
  }
})

test("Смена используемого цвета после accepted move отзывает cached proof и обновляет descendants", () => {
  const f = fixture()
  try {
    f.renderer.flush()
    f.move(10)
    expect(readCanonicalRenderFrameChanges(f.renderer.flush())).not.toBeNull()
    f.surface.setAttribute("style", "--offset-x:20px;--offset-y:0px;--tone:#ff0011")
    const frame = f.renderer.flush()
    expect(readCanonicalRenderFrameChanges(frame), "Используемый inherited color требует обычного cascade").toBeNull()
    expect(frame.displayList.filter(item => item.kind === "text").every(item => item.color === "#ff0011"), "Цвет всех текстовых потомков обновляется в том же frame").toBe(true)
    f.compareFresh(frame)
  } finally {
    f.renderer.dispose()
  }
})

test("После accepted moves новый descendant var consumer читает последнее inherited environment и отзывает proof", () => {
  const f = fixture()
  f.content.setAttribute("style", "--alias:var(--offset-x)")
  try {
    f.renderer.flush()
    for (const offset of [10, 25, 40]) {
      f.resetMeasurements()
      f.move(offset)
      const frame = f.renderer.flush()
      expect(f.measured(), "Неиспользуемый alias не вызывает повторных измерений").toBe(0)
      expect(readCanonicalRenderFrameChanges(frame), "Unused custom declarations не блокируют proof").not.toBeNull()
    }
    f.rows[0]!.setAttribute("style", "width:var(--alias)")
    const consumed = f.renderer.flush()
    expect(consumed.boxByNode.get(f.rows[0]!)?.width, "Новый consumer видит текущий inherited alias").toBe(40)
    f.compareFresh(consumed)
    f.move(60)
    const resized = f.renderer.flush()
    expect(readCanonicalRenderFrameChanges(resized), "Новая зависимость отзывает cached subtree proof").toBeNull()
    expect(resized.boxByNode.get(f.rows[0]!)?.width).toBe(60)
    f.compareFresh(resized)
  } finally {
    f.renderer.dispose()
  }
})

test("Удаление собственного custom property обновляет inherited environment последующих потомков", () => {
  const f = fixture()
  f.root.setAttribute("style", `${f.root.getAttribute("style")};--offset-x:18px;--offset-y:0px`)
  try {
    f.renderer.flush()
    f.surface.removeAttribute("style")
    const moved = f.renderer.flush()
    expect(readCanonicalRenderFrameChanges(moved), "Удаление own variable допускается при полном proof").not.toBeNull()
    f.compareFresh(moved)
    f.rows[0]!.setAttribute("style", "width:var(--offset-x)")
    const consumed = f.renderer.flush()
    expect(consumed.boxByNode.get(f.rows[0]!)?.width).toBe(18)
    f.compareFresh(consumed)
  } finally {
    f.renderer.dispose()
  }
})
