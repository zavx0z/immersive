import {describe, expect, test} from "bun:test"
import {createDocument} from "@zavx0z/dom"
import {createDocumentRenderer, hitTest} from "../src/index.ts"

function fixture(mode = "horizontal-tb", orientation = "sideways", text = "Tab") {
  const document = createDocument()
  const root = document.createElement("div")
  root.setAttribute("style", "display:flex;align-items:flex-start;width:300px;height:300px")
  const label = document.createElement("span")
  label.setAttribute("style", `font-size:10px;line-height:20px;white-space:pre;writing-mode:${mode};text-orientation:${orientation}`)
  const node = document.createTextNode(text)
  label.append(node)
  root.append(label)
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 300, height: 300}})
  return {document, root, label, node, renderer}
}

describe("vertical text writing modes", () => {
  test.each(["vertical-rl", "vertical-lr", "sideways-rl", "sideways-lr"])("%s changes intrinsic axes and paint direction", mode => {
    const f = fixture(mode)
    try {
      const frame = f.renderer.flush()
      expect(frame.boxByNode.get(f.label)).toMatchObject({width: 20, height: 18})
      expect(frame.displayList.find(item => item.kind === "text")).toMatchObject({
        text: "Tab", orientation: mode === "sideways-lr" ? "sideways-lr" : "sideways-rl", inlineSize: 18,
      })
      expect(hitTest(frame, 10, 10)?.node).toBe(f.label)
    } finally { f.renderer.dispose() }
  })

  test("inheritance and changes preserve text node identity and remeasure both axes", () => {
    const f = fixture()
    try {
      expect(f.renderer.flush().boxByNode.get(f.label)).toMatchObject({width: 18, height: 20})
      f.label.setAttribute("style", f.label.getAttribute("style")!.replace("horizontal-tb", "vertical-rl"))
      expect(f.renderer.flush().boxByNode.get(f.label)).toMatchObject({width: 20, height: 18})
      f.node.data = "Tabs"
      expect(f.renderer.flush().boxByNode.get(f.label)).toMatchObject({width: 20, height: 24})
      f.label.setAttribute("style", f.label.getAttribute("style")!.replace("vertical-rl", "horizontal-tb"))
      expect(f.renderer.flush().boxByNode.get(f.label)).toMatchObject({width: 24, height: 20})
      expect(f.label.firstChild).toBe(f.node)
    } finally { f.renderer.dispose() }
  })

  test.each(["vertical-rl", "vertical-lr"])("%s stacks explicit text lines into ordered columns", mode => {
    const f = fixture(mode, "sideways", "AB\nC")
    try {
      const frame = f.renderer.flush()
      expect(frame.boxByNode.get(f.label)).toMatchObject({width: 40, height: 12})
      const text = frame.displayList.filter(item => item.kind === "text")
      expect(text.map(item => item.x)).toEqual(mode === "vertical-rl" ? [20, 0] : [0, 20])
      expect(text.map(item => item.key)).toEqual(["text:0", "text:1"])
    } finally { f.renderer.dispose() }
  })

  test("mixed keeps Latin sideways and East Asian graphemes upright", () => {
    const f = fixture("vertical-rl", "mixed", "A漢B")
    try {
      const frame = f.renderer.flush()
      const text = frame.displayList.filter(item => item.kind === "text")
      expect(text.map(item => [item.text, item.orientation])).toEqual([
        ["A", "sideways-rl"], ["漢", undefined], ["B", "sideways-rl"],
      ])
      expect(frame.boxByNode.get(f.label)).toMatchObject({width: 20, height: 22})
      f.label.setAttribute("style", f.label.getAttribute("style")! + ";writing-mode:invalid;text-orientation:invalid")
      expect(f.renderer.flush().boxByNode.get(f.label)).toMatchObject({width: 20, height: 22})
    } finally { f.renderer.dispose() }
  })

  test("upright emits graphemes without rotation with em advances", () => {
    const f = fixture("vertical-rl", "upright", "AB")
    try {
      const frame = f.renderer.flush()
      expect(frame.boxByNode.get(f.label)).toMatchObject({width: 20, height: 20})
      const text = frame.displayList.filter(item => item.kind === "text")
      expect(text.map(item => item.text)).toEqual(["A", "B"])
      expect(text.map(item => item.y)).toEqual([0, 10])
      expect(text.every(item => item.orientation === undefined)).toBeTrue()
    } finally { f.renderer.dispose() }
  })
})

test("logical padding follows writing-mode and preserves physical cascade precedence", () => {
  const f = fixture()
  const base = "font-size:10px;line-height:20px;padding-inline:6px;padding-block:2px;writing-mode:"
  try {
    for (const mode of ["horizontal-tb", "vertical-rl", "vertical-lr", "sideways-rl", "sideways-lr"]) {
      f.label.setAttribute("style", base + mode)
      const box = f.renderer.flush().boxByNode.get(f.label)!
      expect(box.padding).toEqual(mode === "horizontal-tb"
        ? {left: 6, right: 6, top: 2, bottom: 2}
        : {left: 2, right: 2, top: 6, bottom: 6})
    }
    f.label.setAttribute("style", base + "vertical-rl;padding-top:9px")
    expect(f.renderer.flush().boxByNode.get(f.label)!.padding.top).toBe(9)
    f.label.setAttribute("style", "padding-top:9px;" + base + "vertical-rl")
    expect(f.renderer.flush().boxByNode.get(f.label)!.padding.top).toBe(6)
    f.label.setAttribute("style", base + "sideways-lr;padding-inline-start:8px;padding-block-start:3px")
    expect(f.renderer.flush().boxByNode.get(f.label)!.padding).toEqual({top: 6, bottom: 8, left: 3, right: 2})
  } finally { f.renderer.dispose() }
})
