import {expect, test} from "bun:test"
import {createDocument, registerTextSourceRoot, type Element} from "@zavx0z/immersive-dom"
import {createDocumentRenderer, readRenderedSelectionText} from "../src/index.ts"

function fixture() {
  const document = createDocument()
  const root = document.createElement("main")
  root.setAttribute("style", "width:200px;font-size:10px;line-height:14px")
  document.append(root)
  const renderer = createDocumentRenderer({document, root, viewport: {width: 200, height: 100},
    textMeasurer: {measureTextAdvance: (text: string) => text.length * 5}})
  const node = (parent: Element, name: string, text: string, style = "") => {
    const element = document.createElement(name)
    element.setAttribute("style", style)
    element.textContent = text
    parent.append(element)
    return element
  }
  return {document, root, renderer, node}
}

test("source root сохраняет пробелы, UTF-16, CRLF и hidden Text без visual block LF", () => {
  const f = fixture()
  const source = f.node(f.root, "section", "", "white-space:normal;width:40px")
  const prefix = f.node(source, "span", " \t👩‍💻\r\n", "display:none")
  f.node(source, "div", "alpha  ")
  f.node(source, "div", "beta\r\n", "user-select:none")
  f.node(source, "br", "")
  f.node(source, "div", "", "height:14px")
  const suffix = f.node(source, "span", "é\r\n ", "visibility:hidden")
  source.append(f.document.createComment("comment is not source"))
  const expected = " \t👩‍💻\r\nalpha  beta\r\né\r\n "
  const release = registerTextSourceRoot(source)
  try {
    const frame = f.renderer.flush()
    expect(frame.boxByNode.has(prefix.firstChild!)).toBe(false)
    const range = f.document.createRange()
    range.selectNodeContents(source)
    expect(readRenderedSelectionText(frame, range)).toBe(expected)
    range.setStart(prefix.firstChild!, 3)
    range.setEnd(suffix.firstChild!, 3)
    expect(readRenderedSelectionText(frame, range)).toBe(expected.slice(3, expected.length - suffix.textContent.length + 3))
    range.setStart(prefix.firstChild!, 2)
    range.setEnd(prefix.firstChild!, 5)
    expect(range.commonAncestorContainer).toBe(prefix.firstChild!)
    expect(readRenderedSelectionText(frame, range)).toBe(prefix.textContent.slice(2, 5))
    prefix.firstChild!.textContent = "new\r\n"
    range.selectNodeContents(source)
    expect(readRenderedSelectionText(frame, range)).toBe("new\r\n" + expected.slice(" \t👩‍💻\r\n".length))
  } finally { release(); f.renderer.dispose() }
})

test("обычный hidden текст исключается, release возвращает rendered правила", () => {
  const f = fixture()
  const source = f.node(f.root, "section", "")
  f.node(source, "span", "hidden", "display:none")
  f.node(source, "div", "alpha  beta")
  f.node(source, "div", "gamma")
  const range = f.document.createRange()
  range.selectNodeContents(source)
  try {
    const frame = f.renderer.flush()
    expect(readRenderedSelectionText(frame, range)).toBe("alpha beta\ngamma")
    const release = registerTextSourceRoot(source)
    expect(readRenderedSelectionText(frame, range)).toBe("hiddenalpha  betagamma")
    release()
    expect(readRenderedSelectionText(frame, range)).toBe("alpha beta\ngamma")
  } finally { f.renderer.dispose() }
})

test("source root требует бокс кадра того же Document и root-wide user-select", () => {
  const f = fixture()
  const source = f.node(f.root, "section", "", "user-select:none")
  f.node(source, "span", "secret", "user-select:text")
  const release = registerTextSourceRoot(source)
  const range = f.document.createRange()
  range.selectNodeContents(source)
  const other = fixture()
  try {
    expect(readRenderedSelectionText(f.renderer.flush(), range)).toBe("")
    source.setAttribute("style", "display:none")
    expect(readRenderedSelectionText(f.renderer.flush(), range)).toBe("")
    source.setAttribute("style", "display:block")
    expect(readRenderedSelectionText(other.renderer.flush(), range)).toBe("")
    expect(readRenderedSelectionText([other.renderer.flush(), f.renderer.flush()], range)).toBe("secret")
  } finally { release(); f.renderer.dispose(); other.renderer.dispose() }
})

test("границы обычных блоков и двух source roots сохраняются при частичном Range", () => {
  const f = fixture()
  const before = f.node(f.root, "p", "before  text")
  const first = f.node(f.root, "section", "")
  f.node(first, "div", "one  ")
  const hidden = f.node(first, "span", "two", "display:none")
  const second = f.node(f.root, "section", "")
  f.node(second, "div", "three")
  const tail = f.node(second, "span", "  four", "display:none")
  const after = f.node(f.root, "p", "after  text")
  const releaseFirst = registerTextSourceRoot(first)
  const releaseSecond = registerTextSourceRoot(second)
  const range = f.document.createRange()
  try {
    const frame = f.renderer.flush()
    range.selectNodeContents(f.root)
    expect(readRenderedSelectionText(frame, range)).toBe("before text\none  two\nthree  four\nafter text")
    range.setStart(hidden.firstChild!, 1)
    range.setEnd(tail.firstChild!, 4)
    expect(readRenderedSelectionText(frame, range)).toBe("wo\nthree  fo")
    range.setStart(before.firstChild!, 7)
    range.setEnd(after.firstChild!, 5)
    expect(readRenderedSelectionText(frame, range)).toBe(" text\none  two\nthree  four\nafter")
  } finally { releaseFirst(); releaseSecond(); f.renderer.dispose() }
})

test("inline source root сохраняет внешнюю inline границу", () => {
  const f = fixture()
  const paragraph = f.node(f.root, "p", "left ")
  const source = f.node(paragraph, "span", "")
  f.node(source, "span", "raw  ", "display:none")
  f.node(source, "span", "text")
  paragraph.append(f.document.createTextNode(" right"))
  const release = registerTextSourceRoot(source)
  const range = f.document.createRange()
  range.selectNodeContents(paragraph)
  try {
    expect(readRenderedSelectionText(f.renderer.flush(), range)).toBe("left raw  text right")
  } finally { release(); f.renderer.dispose() }
})
