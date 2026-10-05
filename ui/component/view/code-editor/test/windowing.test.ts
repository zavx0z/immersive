import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createDocument, PointerEvent, isTextSourceRoot, textPositionAtOffset, textOffsetAtPosition, type HTMLElement} from "@zavx0z/immersive-dom"
import {flushDocumentLayoutObservers} from "@zavx0z/immersive-dom/geometry"
import {createRoot} from "@zavx0z/immersive-component"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import {createDocumentRenderer, createDocumentInteractionController, readRenderedSelectionText} from "@zavx0z/immersive-renderer-html"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import {createDocumentClipboardController} from "../../../../../browser/clipboard.ts"
import type {ImmersiveUiComponentViewCodeEditor} from "../contract/index.ts"
import type {CodeEditorHandle} from "../contract/types.ts"
import type {WindowingFixtureProps} from "./windowing.fixture.tsx"

const workspace = resolve(import.meta.dir, "../../../../..")
Bun.plugin(createJsxBunPlugin({cwd: workspace, persistent: true, sourceRoots: [resolve(workspace, "ui")]}))
const {WindowingFixture} = await import("./windowing.fixture.tsx")
const template = WindowingFixture as unknown as CompiledTemplate<WindowingFixtureProps>
const theme = await Bun.file(resolve(workspace, "ui/component/theme/theme.css")).text()

function setup(props: WindowingFixtureProps) {
  const document = createDocument()
  const host = document.createElement("div")
  host.setAttribute("style", "display:block;width:600px;height:400px")
  document.append(host)
  const component = createRoot(host)
  let handle: CodeEditorHandle | null = null
  const render = (next: WindowingFixtureProps) => component.render(template,
    {...next, onReady: port => { handle = port }})
  render(props)
  const renderer = createDocumentRenderer({document, root: host, viewport: {width: 600, height: 400}, styleSheets: [theme]})
  const settle = () => {
    for (let count = 0; count < 12; count++) {
      component.flush()
      renderer.flush()
      if (!flushDocumentLayoutObservers(document)) break
    }
    component.flush()
    return renderer.flush()
  }
  const frame = settle()
  const code = host.querySelector("code") as HTMLElement
  const viewport = host.querySelector("section")!
  const written: string[] = []
  const clipboard = createDocumentClipboardController(document, {access: {
    writeText: async text => { written.push(text) }, readText: async () => "",
  }})
  clipboard.configure(() => readRenderedSelectionText(settle(), document.getSelection()), () => {})
  return {document, host, code, viewport, component, renderer, clipboard, written, settle, frame, render,
    get handle() { return handle! },
    dispose() { clipboard.dispose(); renderer.dispose(); component.unmount() },
  }
}

const bigSource = Array.from({length: 13_121}, (_, index) => `const line${index} = "😀 Привет ${index}"`).join("\r\n") + "\r\n"

test("compiled CodeEditor: 13k rows, exact Browser copy, end scroll and disabled gutter", async () => {
  const editor = setup({value: bigSource, readOnly: true, showLineNumbers: false})
  try {
    expect(editor.code.textContent).toBe(bigSource)
    expect(editor.host.querySelectorAll("li")).toHaveLength(0)
    expect(editor.code.querySelectorAll("[data-line-index]").length).toBeLessThan(60)
    expect(editor.host.querySelectorAll("*").length).toBeLessThan(300)
    expect(editor.frame.displayList.length).toBeLessThan(250)
    expect(isTextSourceRoot(editor.code)).toBe(true)
    editor.document.getSelection().selectAllChildren(editor.code)
    expect((await editor.clipboard.copy()).status).toBe("copied")
    expect(editor.written.at(-1)).toBe(bigSource)
    editor.handle.scrollToLine(13_120, {block: "end"})
    editor.settle()
    expect(editor.code.querySelector('[data-line-index="13120"]')).not.toBeNull()
    expect(editor.code.querySelectorAll("[data-line-index]").length).toBeLessThan(60)
    expect((await editor.clipboard.copy()).status).toBe("copied")
    expect(editor.written.at(-1)).toBe(bigSource)
  } finally { editor.dispose() }
  expect(isTextSourceRoot(editor.code)).toBe(false)
}, 30_000)

test("compiled CodeEditor: cross-block backward selection and pointer anchor survive moving gaps", async () => {
  const editor = setup({value: bigSource, readOnly: true})
  try {
    const first = textPositionAtOffset(editor.code, 10)
    const outside = editor.host.querySelectorAll("p")[1]!.firstChild!
    editor.document.getSelection().setBaseAndExtent(outside, 5, first.node, first.offset)
    const initial = editor.document.getSelection().toString()
    const row = editor.code.querySelector('[data-line-index="0"]')!
    row.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, pointerId: 1, button: 0}))
    editor.handle.scrollToLine(9000, {block: "center"})
    editor.settle()
    expect(editor.document.getSelection().toString()).toBe(initial)
    expect(editor.document.getSelection().focusNode).toBe(first.node)
    expect(editor.code.querySelector('[data-line-index="0"]')).toBe(row)
    expect(editor.document.getSelection().anchorNode).toBe(outside)
    expect((await editor.clipboard.copy()).status).toBe("copied")
    expect(editor.written.at(-1)).toBe(bigSource.slice(10) + "После")
    editor.document.dispatchEvent(new PointerEvent("pointerup", {pointerId: 1}))
  } finally { editor.dispose() }
}, 30_000)

test("compiled CodeEditor: Renderer native drag preserves the pointer anchor across viewport replacement", async () => {
  const editor = setup({value: bigSource, readOnly: true, showLineNumbers: false})
  const input = createDocumentInteractionController({document: editor.document})
  try {
    const firstFrame = editor.settle()
    const firstText = firstFrame.displayList.find(item => item.kind === "text" && editor.code.contains(item.node))!
    input.pointerDown(firstFrame, {clientX: firstText.x + 12, clientY: firstText.y + 8, pointerId: 7})
    const selection = editor.document.getSelection()
    const anchor = selection.anchorNode!
    const anchorOffset = textOffsetAtPosition(editor.code, anchor, selection.anchorOffset)!
    expect(anchorOffset).toBeGreaterThan(0)
    editor.handle.scrollToLine(9000, {block: "center"})
    const nextFrame = editor.settle()
    const row = editor.code.querySelector('[data-line-index="9000"]')!
    const nextText = nextFrame.displayList.find(item => item.kind === "text" && row.contains(item.node))!
    input.pointerMove(nextFrame, {clientX: nextText.x + 36, clientY: nextText.y + 8, buttons: 1, pointerId: 7})
    input.pointerUp(nextFrame, {clientX: nextText.x + 36, clientY: nextText.y + 8, pointerId: 7})
    const head = textOffsetAtPosition(editor.code, selection.focusNode!, selection.focusOffset)!
    expect(selection.anchorNode).toBe(anchor)
    expect(head).toBeGreaterThan(200_000)
    expect(selection.toString()).toBe(bigSource.slice(anchorOffset, head))
    expect((await editor.clipboard.copy()).status).toBe("copied")
    expect(editor.written.at(-1)).toBe(bigSource.slice(anchorOffset, head))
    expect(editor.code.querySelectorAll("[data-line-index]").length).toBeLessThan(60)
  } finally { input.dispose(); editor.dispose() }
}, 30_000)

test("compiled CodeEditor: Shift native drag starts from a programmatic hidden gap anchor", async () => {
  const editor = setup({value: bigSource, readOnly: true, showLineNumbers: false})
  const input = createDocumentInteractionController({document: editor.document})
  try {
    const anchorOffset = 200_000
    editor.handle.setSelections([{anchor: anchorOffset, head: anchorOffset}])
    const hiddenAnchor = editor.document.getSelection().anchorNode!
    expect(hiddenAnchor.parentElement?.closest("[data-code-gap]")).not.toBeNull()
    const initialFrame = editor.settle()
    const firstText = initialFrame.displayList.find(item => item.kind === "text" && editor.code.contains(item.node))!
    input.pointerDown(initialFrame, {clientX: firstText.x + 12, clientY: firstText.y + 8, pointerId: 7, shiftKey: true})
    const stableAnchor = editor.document.getSelection().anchorNode!
    expect(stableAnchor).not.toBe(hiddenAnchor)
    expect(stableAnchor.isConnected).toBe(true)
    expect(textOffsetAtPosition(editor.code, stableAnchor, editor.document.getSelection().anchorOffset)).toBe(anchorOffset)
    editor.handle.scrollToLine(9000, {block: "center"})
    const nextFrame = editor.settle()
    const row = editor.code.querySelector('[data-line-index="9000"]')!
    const nextText = nextFrame.displayList.find(item => item.kind === "text" && row.contains(item.node))!
    input.pointerMove(nextFrame, {clientX: nextText.x + 36, clientY: nextText.y + 8, buttons: 1, pointerId: 7})
    input.pointerUp(nextFrame, {clientX: nextText.x + 36, clientY: nextText.y + 8, pointerId: 7})
    const selection = editor.document.getSelection()
    const head = textOffsetAtPosition(editor.code, selection.focusNode!, selection.focusOffset)!
    expect(selection.anchorNode).toBe(stableAnchor)
    expect(textOffsetAtPosition(editor.code, selection.anchorNode!, selection.anchorOffset)).toBe(anchorOffset)
    expect(selection.toString()).toBe(bigSource.slice(anchorOffset, head))
    expect((await editor.clipboard.copy()).status).toBe("copied")
    expect(editor.written.at(-1)).toBe(bigSource.slice(anchorOffset, head))
  } finally { input.dispose(); editor.dispose() }
}, 30_000)

test("compiled CodeEditor: widest visited row retains horizontal scroll after returning to the first window", () => {
  const lines = Array.from({length: 6000}, (_, index) => index === 5000 ? "W".repeat(600) : `line ${index}`)
  const source = lines.join("\n")
  const editor = setup({value: source, readOnly: true, showLineNumbers: false})
  try {
    editor.handle.scrollToLine(5000, {block: "center"})
    let frame = editor.settle()
    const metrics = frame.scrolls.get(editor.viewport)!
    expect(metrics.maxScrollLeft).toBeGreaterThan(200)
    const viewport = editor.viewport as HTMLElement
    viewport.scrollLeft = 120
    editor.settle()
    editor.handle.scrollToLine(0, {block: "start"})
    frame = editor.settle()
    expect(frame.scrolls.get(viewport)?.scrollLeft).toBe(120)
    expect(frame.scrolls.get(viewport)?.maxScrollLeft).toBe(metrics.maxScrollLeft)
    expect(editor.code.querySelector('[data-line-index="5000"]')).not.toBeNull()
    expect(editor.code.textContent).toBe(source)
  } finally { editor.dispose() }
}, 30_000)

test("compiled CodeEditor: programmatic gap endpoints, source update and viewport resize", async () => {
  const editor = setup({value: bigSource, readOnly: true, showLineNumbers: false})
  try {
    editor.handle.setSelections([{anchor: 200_000, head: 210_000}])
    editor.handle.scrollToLine(8000, {block: "start"})
    editor.settle()
    expect(editor.document.getSelection().toString()).toBe(bigSource.slice(200_000, 210_000))
    const next = "prefix\r\n" + bigSource
    editor.render({value: next, readOnly: true, showLineNumbers: false})
    editor.settle()
    expect(editor.code.textContent).toBe(next)
    expect(editor.document.getSelection().toString()).toBe(bigSource.slice(200_000, 210_000))
    const selection = editor.document.getSelection()
    expect(textOffsetAtPosition(editor.code, selection.anchorNode!, selection.anchorOffset)).toBe(200_008)
    const before = editor.code.querySelectorAll("[data-line-index]").length
    editor.render({value: next, readOnly: true, showLineNumbers: false, viewportHeight: 400})
    const resized = editor.settle()
    expect(resized.boxByNode.get(editor.viewport)?.height).toBe(400)
    expect(editor.code.querySelectorAll("[data-line-index]").length).toBeGreaterThan(before)
    expect(editor.code.querySelectorAll("[data-line-index]").length).toBeLessThan(80)
  } finally { editor.dispose() }
}, 30_000)

test("compiled CodeEditor: softBreaks, hidden formatting and small/editable paths keep exact source", async () => {
  const source = 'const text = "LEFT\\nRIGHT 😀"\r\nlast'
  const softBreaks = [source.indexOf("RIGHT")]
  const editor = setup({value: source, readOnly: true, softBreaks, showFormattingCharacters: false})
  try {
    expect(editor.code.querySelector("[data-formatting-characters]")?.textContent).toBe("\\n")
    editor.document.getSelection().selectAllChildren(editor.code)
    expect((await editor.clipboard.copy()).status).toBe("copied")
    expect(editor.written.at(-1)).toBe(source)
    editor.render({value: source, readOnly: false})
    editor.settle()
    expect(editor.code.contentEditable).toBe("plaintext-only")
    expect(editor.code.textContent).toBe(source)
    expect(editor.code.querySelectorAll("[data-code-gap]")).toHaveLength(0)
  } finally { editor.dispose() }
}, 30_000)

test("compiled CodeEditor: shrinking a document at its old end clamps rows before geometry catches up", () => {
  const editor = setup({value: bigSource, readOnly: true, showLineNumbers: false})
  try {
    editor.handle.scrollToLine(13_120, {block: "end"})
    editor.settle()
    const source = Array.from({length: 300}, (_, index) => `short ${index}`).join("\n")
    expect(() => editor.render({value: source, readOnly: true, showLineNumbers: false})).not.toThrow()
    editor.settle()
    expect(editor.code.textContent).toBe(source)
    expect(editor.code.querySelector('[data-line-index="299"]')).not.toBeNull()
    expect(editor.code.querySelectorAll("[data-line-index]").length).toBeLessThan(60)
    expect(editor.renderer.flush().scrolls.get(editor.viewport)?.scrollTop).toBeLessThan(6000)
    editor.handle.scrollToLine(0, {block: "start"})
    editor.settle()
    expect(editor.code.querySelector('[data-line-index="0"]')).not.toBeNull()
  } finally { editor.dispose() }
}, 30_000)

test("compiled CodeEditor: editable-to-readonly transition retains the existing directed selection", () => {
  const source = "one\ntwo\nthree"
  const editor = setup({value: source, readOnly: false, showLineNumbers: false})
  try {
    editor.handle.focus()
    editor.handle.setSelections([{anchor: 9, head: 4}])
    expect(editor.document.getSelection().toString()).toBe(source.slice(4, 9))
    editor.render({value: source, readOnly: true, showLineNumbers: false})
    editor.settle()
    const selection = editor.document.getSelection()
    expect(selection.toString()).toBe(source.slice(4, 9))
    expect(textOffsetAtPosition(editor.code, selection.anchorNode!, selection.anchorOffset)).toBe(9)
    expect(textOffsetAtPosition(editor.code, selection.focusNode!, selection.focusOffset)).toBe(4)
  } finally { editor.dispose() }
}, 30_000)
