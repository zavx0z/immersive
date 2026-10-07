import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot, component, provideContext} from "@zavx0z/immersive-component"
import {createDocument, Event} from "@zavx0z/immersive-dom"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import {MarkdownMediaContext, type MarkdownMediaHost, type MarkdownImageSource} from "../src/media.ts"
import type {MarkdownProps} from "../contract/input.ts"
import type {CallerImageProps} from "./media-renderer.fixture"

const repository = resolve(import.meta.dir, "../../..")
Bun.plugin(createJsxBunPlugin({cwd: repository, persistent: true,
  sourceRoots: [resolve(repository, "markdown"), resolve(repository, "ui"), resolve(repository, "nodes")],
}))
const {Markdown} = await import("../index.tsx")
const {default: CallerImage} = await import("./media-renderer.fixture.tsx")

function fixture(host: MarkdownMediaHost) {
  const document = createDocument()
  const container = document.createElement("div")
  container.setAttribute("style", "width:360px;height:320px")
  document.append(container)
  const root = createRoot(container)
  const props: MarkdownProps = {source: 'Слева **жирный** ![Фото](./image.png "Титул") справа [ссылка](/ok)', baseUrl: "https://example.test/docs/"}
  root.render(provideContext(MarkdownMediaContext, host, component(Markdown as unknown as CompiledTemplate<MarkdownProps>, props)))
  const renderer = createDocumentRenderer({document, root: container, viewport: {width: 360, height: 320}})
  return {container, root, renderer,
    async settle() {for (let round = 0; round < 5; round++) {root.flush(); renderer.flush(); await Bun.sleep(0)}},
    dispose() {root.unmount(); renderer.dispose()},
  }
}

test("caller image компонуется штатным component/slot: parser source, стабильный текст/article/inline geometry и собственный cleanup", async () => {
  let active = true
  let mounted = 0
  let disposed = 0
  let loads = 0
  const images: MarkdownImageSource[] = []
  const listeners = new Set<() => void>()
  const store = {getSnapshot: () => active, subscribe(listener: () => void) {listeners.add(listener); return () => {listeners.delete(listener)}}}
  const host: MarkdownMediaHost = {
    renderImage(image) {
      images.push(image)
      const props: CallerImageProps = {image, store, mounted() {mounted++}, disposed() {disposed++}}
      return component(CallerImage as unknown as CompiledTemplate<CallerImageProps>, props) as unknown as JSX.Element
    },
    async loadImage() {loads++; throw new Error("Caller renderer не использует стандартный loader")},
  }
  const f = fixture(host)
  try {
    await f.settle()
    expect(images[0]).toMatchObject({src: "https://example.test/docs/image.png", alt: "Фото", title: "Титул"})
    expect(loads).toBe(0)
    expect(mounted).toBe(1)
    const article = f.container.querySelector("article")!
    const paragraph = article.querySelector("p")!
    const inline = article.querySelector("[data-markdown-image]")!
    const image = article.querySelector("[data-caller-image]")!
    const text = paragraph.firstChild
    const strong = paragraph.querySelector("strong")!
    const height = image.getLayoutRect()!.height
    for (const next of [false, true, false, true]) {
      active = next
      for (const listener of listeners) listener()
      await f.settle()
      expect(f.container.querySelector("article")).toBe(article)
      expect(article.querySelector("p")).toBe(paragraph)
      expect(paragraph.firstChild).toBe(text)
      expect(paragraph.querySelector("strong")).toBe(strong)
      expect(article.querySelector("[data-markdown-image]")).toBe(inline)
      expect(article.querySelector("[data-caller-image]")).toBe(image)
      expect(image.hasAttribute("src")).toBe(next)
      expect(image.getLayoutRect()!.height).toBe(height)
    }
    expect(loads).toBe(0)
    expect(mounted).toBe(1)
    expect(disposed).toBe(0)
    expect(article.querySelector("a")!.getAttribute("href")).toBe("https://example.test/ok")
  } finally {f.dispose()}
  expect(disposed).toBe(1)
  expect(listeners.size).toBe(0)
})

test("без caller renderer прежний managed load/open/release и политика ссылок сохраняются", async () => {
  let loads = 0
  let releases = 0
  let opened = ""
  const f = fixture({linkTarget: "_blank",
    async loadImage() {loads++; return {url: "provided:managed", width: 240, height: 120, release() {releases++}}},
    openImage(image) {opened = image.src},
  })
  try {
    await f.settle()
    expect(loads).toBe(1)
    const image = f.container.querySelector("img")!
    expect(image.getAttribute("src")).toBe("provided:managed")
    const button = image.parentElement!
    button.dispatchEvent(new Event("click", {bubbles: true}))
    expect(opened).toBe("https://example.test/docs/image.png")
    expect(f.container.querySelector("a")!.getAttribute("target")).toBe("_blank")
  } finally {f.dispose()}
  expect(releases).toBe(1)
})
