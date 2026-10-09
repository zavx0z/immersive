import {expect, test} from "bun:test"
import {createDocument, HTMLElement} from "@zavx0z/immersive-dom"
import {createDocumentRenderer, hitTestProjection, type RenderFrame} from "../src/index.ts"
import {readCanonicalRenderFrameChanges} from "../src/frame-changes.ts"

const fixture = (styleSheets: readonly string[] = []) => {
  const document = createDocument()
  const root = document.createElement("main")
  if (!(root instanceof HTMLElement)) throw new TypeError("Expected an HTML root")
  root.setAttribute("style", "width:320px;height:240px")
  document.append(root)
  const add = (parent: HTMLElement, style: string, tag = "div") => {
    const node = document.createElement(tag)
    if (!(node instanceof HTMLElement)) throw new TypeError("Expected an HTML fixture element")
    node.setAttribute("style", style)
    parent.append(node)
    return node
  }
  const renderer = createDocumentRenderer({document, root, viewport: {width: 320, height: 240}, styleSheets})
  return {document, root, add, renderer}
}

const backdrop = (frame: RenderFrame, node: HTMLElement) =>
  frame.displayList.find(item => item.node === node && item.kind === "rect" && item.key === "backdrop")

test.each([
  ["blur(8px)", 8],
  ["blur(0)", 0],
  ["blur(0px)", 0],
  [" BLUR( +2.5PX ) ", 2.5],
  ["blur(1e1px)", 10],
] as const)("backdrop-filter: %s emits a separate operation on transparent boxes", (filter, sigma) => {
  const f = fixture()
  const panel = f.add(f.root, `width:80px;height:40px;background:transparent;backdrop-filter:${filter}`)
  const child = f.add(panel, "width:10px;height:10px;background:red")
  try {
    const frame = f.renderer.flush()
    expect(backdrop(frame, panel)).toMatchObject({backdropBlur: sigma, color: "#ffffff", opacity: 1, shadow: null})
    expect(frame.displayList.filter(item => item.node === panel).map(item => item.key)).toEqual(["backdrop"])
    expect(frame.displayList.find(item => item.node === child)).not.toHaveProperty("backdropBlur")
  } finally { f.renderer.dispose() }
})

test.each([
  "blur(-1px)", "blur(2)", "blur(20%)", "blur(1em)", "blur()", "blur(Infinitypx)",
  "blur(NaNpx)", "blur(1e999px)", "blur(1.px)", "blur(2px) blur(4px)", "brightness(1)", "blur(2px),blur(3px)",
])("invalid %s preserves a valid earlier declaration and lower specificity rule", invalid => {
  const f = fixture([".glass {backdrop-filter:blur(6px)} #panel {backdrop-filter:brightness(2)}"])
  const panel = f.add(f.root, `width:80px;height:40px;backdrop-filter:blur(3px);backdrop-filter:${invalid}`)
  panel.className = "glass"
  panel.id = "panel"
  try {
    expect(backdrop(f.renderer.flush(), panel)).toMatchObject({backdropBlur: 3})
    panel.setAttribute("style", `width:80px;height:40px;backdrop-filter:${invalid}`)
    expect(backdrop(f.renderer.flush(), panel)).toMatchObject({backdropBlur: 6})
  } finally { f.renderer.dispose() }
})

test("backdrop precedes own border/background and descendants, follows shadow and preserves rounded geometry", () => {
  const f = fixture()
  const panel = f.add(f.root, "width:80px;height:40px;background:#123456;border:2px solid red;border-radius:12px;box-shadow:2px 3px 4px black;backdrop-filter:blur(5px);opacity:.5")
  const child = f.add(panel, "width:10px;height:10px;background:blue")
  try {
    const frame = f.renderer.flush()
    expect(frame.displayList.map(item => [item.node, item.key])).toEqual([
      [panel, "shadow"], [panel, "backdrop"], [panel, "background"], [child, "background"],
    ])
    const operation = backdrop(frame, panel)!
    expect(operation).toMatchObject({width: 84, height: 44, opacity: .5,
      border: {widths: {top: 0, right: 0, bottom: 0, left: 0},
        radii: {topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12}}})
    expect(frame.displayList.filter(item => item.key !== "backdrop").every(item => !("backdropBlur" in item))).toBe(true)
  } finally { f.renderer.dispose() }
})

test("none, removal, custom properties and style changes update the backdrop without inheriting it", () => {
  const f = fixture([".glass {backdrop-filter:blur(var(--sigma))}"])
  const panel = f.add(f.root, "width:80px;height:40px;--sigma:3px")
  panel.className = "glass"
  const child = f.add(panel, "width:10px;height:10px;background:red")
  try {
    expect(backdrop(f.renderer.flush(), panel)).toMatchObject({backdropBlur: 3})
    expect(backdrop(f.renderer.flush(), child)).toBeUndefined()
    panel.setAttribute("style", "width:80px;height:40px;--sigma:9px")
    expect(backdrop(f.renderer.flush(), panel)).toMatchObject({backdropBlur: 9})
    panel.setAttribute("style", "width:80px;height:40px;backdrop-filter:none")
    expect(backdrop(f.renderer.flush(), panel)).toBeUndefined()
    panel.className = ""
    panel.setAttribute("style", "width:80px;height:40px;backdrop-filter:blur(4px)")
    expect(backdrop(f.renderer.flush(), panel)).toMatchObject({backdropBlur: 4})
    panel.setAttribute("style", "width:80px;height:40px")
    expect(backdrop(f.renderer.flush(), panel)).toBeUndefined()
  } finally { f.renderer.dispose() }
})

test.each(["visibility:hidden", "display:none", "opacity:0", "width:0", "height:0"])("%s omits backdrop paint", hidden => {
  const f = fixture()
  const panel = f.add(f.root, `width:80px;height:40px;backdrop-filter:blur(5px);${hidden}`)
  try { expect(backdrop(f.renderer.flush(), panel)).toBeUndefined() }
  finally { f.renderer.dispose() }
})

test("effective zero opacity suppresses descendants while hidden layout can reveal a descendant", () => {
  const f = fixture()
  const owner = f.add(f.root, "opacity:0")
  const panel = f.add(owner, "width:80px;height:40px;backdrop-filter:blur(5px)")
  try {
    expect(backdrop(f.renderer.flush(), panel)).toBeUndefined()
    owner.setAttribute("style", "visibility:hidden;opacity:.5")
    panel.setAttribute("style", "width:80px;height:40px;visibility:visible;opacity:.5;backdrop-filter:blur(5px)")
    expect(backdrop(f.renderer.flush(), panel)).toMatchObject({opacity: .25})
  } finally { f.renderer.dispose() }
})

test("overflow clips, scrolling and transform-only updates retain backdrop operations and match full paint", () => {
  const f = fixture()
  const owner = f.add(f.root, "width:150px;height:80px;overflow:auto;border-radius:14px")
  const panel = f.add(owner, "width:180px;height:200px;backdrop-filter:blur(7px);background:#abcdef;transform:translate(2px,3px);transform-origin:0 0")
  try {
    const initial = f.renderer.flush()
    const first = backdrop(initial, panel)!
    expect(first.clips).toHaveLength(1)
    expect(first.clips[0]).toMatchObject({width: 150, height: 80, radii: {topLeft: {x: 14, y: 14}}})
    owner.scrollTop = 30
    const scrolled = f.renderer.flush()
    const moved = backdrop(scrolled, panel)!
    expect(moved).toMatchObject({backdropBlur: 7, y: -30, transform: {translateX: 2, translateY: 3}})
    expect(readCanonicalRenderFrameChanges(scrolled)?.previous).toBe(initial)
    panel.setAttribute("style", "width:180px;height:200px;backdrop-filter:blur(7px);background:#abcdef;transform:translate(8px,9px);transform-origin:0 0")
    const transformed = f.renderer.flush()
    const operation = backdrop(transformed, panel)!
    expect(operation).toMatchObject({backdropBlur: 7, y: -30, transform: {translateX: 8, translateY: 9}})
    expect(readCanonicalRenderFrameChanges(transformed)?.previous).toBe(scrolled)
    expect(readCanonicalRenderFrameChanges(transformed)?.indexes).toContain(
      transformed.displayList.indexOf(operation),
    )
    f.renderer.invalidate(f.root)
    expect(backdrop(f.renderer.flush(), panel)).toEqual(operation)
    expect(first).toMatchObject({y: 0, transform: {translateX: 2, translateY: 3}})
  } finally { f.renderer.dispose() }
})

test("inline elements with backdrop blur retain an independent paint operation", () => {
  const f = fixture()
  const panel = f.add(f.root, "backdrop-filter:blur(3px)", "span")
  panel.textContent = "glass"
  try {
    const frame = f.renderer.flush()
    expect(backdrop(frame, panel)).toMatchObject({backdropBlur: 3})
    expect(frame.displayList[0]?.key).toBe("backdrop")
    expect(frame.displayList.some(item => item.kind === "text")).toBe(true)
  } finally { f.renderer.dispose() }
})

test("nested and overlapping filters keep separate operations in the current paint order", () => {
  const f = fixture()
  const behind = f.add(f.root, "position:absolute;width:80px;height:40px;background:red")
  const outer = f.add(f.root, "position:absolute;width:80px;height:40px;backdrop-filter:blur(6px);background:#ffffff80")
  const inner = f.add(outer, "width:40px;height:20px;backdrop-filter:blur(2px);background:blue")
  const front = f.add(f.root, "position:absolute;width:80px;height:40px;backdrop-filter:blur(4px)")
  try {
    const frame = f.renderer.flush()
    expect(frame.displayList.map(item => [item.node, item.key])).toEqual([
      [behind, "background"], [outer, "backdrop"], [outer, "background"],
      [inner, "backdrop"], [inner, "background"], [front, "backdrop"],
    ])
    f.document.transaction(() => {
      outer.setAttribute("style", "position:absolute;width:80px;height:40px;backdrop-filter:none;transform:translate(5px,8px)")
      inner.setAttribute("style", "width:40px;height:20px;backdrop-filter:blur(9px);background:blue")
    })
    const changed = f.renderer.flush()
    expect(backdrop(changed, outer)).toBeUndefined()
    expect(backdrop(changed, inner)).toMatchObject({backdropBlur: 9, transform: {translateX: 5, translateY: 8}})
  } finally { f.renderer.dispose() }
})


test("zero blur does not turn a transparent empty box into projection input occlusion", () => {
  const f = fixture()
  const panel = f.add(f.root, "width:80px;height:40px;background:transparent;backdrop-filter:blur(0px)")
  try {
    expect(hitTestProjection(f.renderer.flush(), 20, 20)).toBeNull()
    panel.setAttribute("style", "width:80px;height:40px;background:transparent;backdrop-filter:blur(3px)")
    expect(hitTestProjection(f.renderer.flush(), 20, 20)?.node === panel).toBeTrue()
    panel.setAttribute("style", "width:80px;height:40px;background:transparent;backdrop-filter:none")
    expect(hitTestProjection(f.renderer.flush(), 20, 20)).toBeNull()
  } finally { f.renderer.dispose() }
})
