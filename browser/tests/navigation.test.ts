import {expect, test} from "bun:test"
import {createDocument, MouseEvent, KeyboardEvent} from "@zavx0z/immersive-dom"
import {createDocumentNavigationHost} from "../navigation"

test("semantic anchor использует native navigation/download только после default action, cancellation/dispose respected", async () => {
  const document = createDocument()
  const anchor = document.createElement("a")
  const text = document.createElement("span")
  anchor.append(text)
  anchor.setAttribute("href", "/original.png")
  anchor.setAttribute("download", "Оригинал.png")
  document.append(anchor)
  const calls: {href: string, target: string, download: string}[] = []
  let removed = 0
  const native = {baseURI: "https://example.com/chat", body: {append() {}}, createElement() {
    return {href: "", target: "", rel: "", download: "", hidden: false,
      click() {calls.push({href: this.href, target: this.target, download: this.download})}, remove() {removed++}}
  }}
  const host = createDocumentNavigationHost(document, native as unknown as Document)
  text.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, button: 0}))
  await Promise.resolve()
  expect(calls).toEqual([{href: "https://example.com/original.png", target: "_self", download: "Оригинал.png"}])
  expect(removed).toBe(1)
  document.addEventListener("click", event => event.preventDefault(), {once: true})
  text.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, button: 0}))
  await Promise.resolve()
  expect(calls).toHaveLength(1)
  anchor.setAttribute("href", "javascript:alert(1)")
  anchor.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "Enter"}))
  await Promise.resolve()
  expect(calls).toHaveLength(1)
  anchor.setAttribute("href", "https://example.com/again")
  anchor.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, button: 0, ctrlKey: true}))
  host.dispose()
  await Promise.resolve()
  expect(calls).toHaveLength(1)
})

test("host _blank ссылка вызывает новую native вкладку с opener protection, текущий URL не переписывается", async () => {
  const document = createDocument()
  const anchor = document.createElement("a")
  anchor.setAttribute("href", "https://example.com/source")
  anchor.setAttribute("target", "_blank")
  anchor.setAttribute("rel", "noreferrer")
  document.append(anchor)
  const calls: {href: string, target: string, rel: string}[] = []
  const native = {baseURI: "https://storybook.local/chat", body: {append() {}}, createElement() {
    return {href: "", target: "", rel: "", hidden: false,
      click() {calls.push({href: this.href, target: this.target, rel: this.rel})}, remove() {}}
  }}
  const host = createDocumentNavigationHost(document, native as unknown as Document)
  try {
    anchor.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, button: 0}))
    await Promise.resolve()
    expect(calls).toEqual([{href: "https://example.com/source", target: "_blank", rel: "noreferrer noopener"}])
    expect(native.baseURI).toBe("https://storybook.local/chat")
  } finally {host.dispose()}
})
