import {expect, test} from "bun:test"
import {createDocument, registerTextSourceRoot} from "@zavx0z/immersive-dom"
import {createDocumentRenderer, readRenderedSelectionText} from "@zavx0z/immersive-renderer-html"
import {createDocumentClipboardController} from "../clipboard.ts"

test("Browser copy и native copy используют точный source root через Renderer reader", async () => {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "width:200px;font-size:10px;line-height:14px")
  const source = document.createElement("section")
  const prefix = document.createElement("span")
  prefix.setAttribute("style", "display:none")
  prefix.textContent = "{\r\n\t"
  const first = document.createElement("div")
  first.textContent = '"emoji": "👩‍💻",'
  const second = document.createElement("div")
  second.textContent = '\r\n\t"text": "a  b"'
  const suffix = document.createElement("span")
  suffix.setAttribute("style", "display:none")
  suffix.textContent = "\r\n}"
  const decoration = document.createElement("button")
  decoration.textContent = "Копировать"
  decoration.setAttribute("style", "user-select:none")
  const menu = document.createElement("button")
  source.append(prefix, first, second, suffix)
  root.append(source, decoration, menu)
  document.append(root)
  const release = registerTextSourceRoot(source)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 200, height: 100}})
  const written: string[] = []
  const controller = createDocumentClipboardController(document, {
    readSelectionText: () => readRenderedSelectionText(renderer.flush(), document.getSelection()),
    access: {readText: async () => "unused", writeText: async text => { written.push(text) }},
  })
  controller.subscribe(() => {})
  const expected = '{\r\n\t"emoji": "👩‍💻",\r\n\t"text": "a  b"\r\n}'
  try {
    document.getSelection().selectAllChildren(source)
    expect(controller.openContextMenu(source, {x: 0, y: 0})).toBe(true)
    menu.focus()
    expect(await controller.copy()).toEqual({status: "copied"})
    expect(written).toEqual([expected])
    expect(JSON.parse(written[0]!)).toEqual({emoji: "👩‍💻", text: "a  b"})
    controller.close()
    document.getSelection().setBaseAndExtent(prefix.firstChild!, 1, suffix.firstChild!, 2)
    expect(await controller.copy()).toEqual({status: "copied"})
    expect(written[1]).toBe(expected.slice(1, -1))
    document.getSelection().selectAllChildren(root)
    const native = new Map<string, string>()
    const event = {type: "copy", defaultPrevented: false,
      clipboardData: {getData: () => "", setData: (type: string, text: string) => { native.set(type, text) }},
      preventDefault() { this.defaultPrevented = true },
    }
    expect(controller.handleNative(event as unknown as globalThis.ClipboardEvent, source)).toBe(true)
    expect(native.get("text/plain")).toBe(expected)
  } finally { controller.dispose(); release(); renderer.dispose() }
})
