import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@immersive/component"
import {createDocument} from "@immersive/dom"
import createJsxBunPlugin from "@immersive-jsx-compiler/bun"
import type {CompiledTemplate} from "@immersive/template/compiled"

const root = resolve(import.meta.dir, "../../..")
Bun.plugin(createJsxBunPlugin({
  cwd: root,
  persistent: true,
  sourceRoots: [resolve(root, "nodes/projection/parameter"), resolve(root, "nodes"), resolve(root, "ui")],
}))

const {Frame} = await import("@immersive/nodes/frame")

test("[NODES-TITLE-001-FRAME] Frame не распространяет tooltip на всю поверхность", () => {
  const frame = mount(Frame, {
    id: "frame",
    label: "Видимая рамка",
    title: "Описание рамки",
    rect: {x: 0, y: 0, width: 320, height: 180},
  })
  const section = frame.element.querySelector('section[data-frame-id="frame"]')!
  expect(section.hasAttribute("title")).toBe(false)
  expect(section.querySelector('[data-frame-label]')?.getAttribute("title")).toBe("Описание рамки")
  frame.dispose()
})

function mount<Props extends Readonly<Record<string, unknown>>>(component: unknown, props: Props) {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  const componentRoot = createRoot(element)
  componentRoot.render(component as CompiledTemplate<Props>, props)
  return {
    element,
    dispose() {
      componentRoot.unmount()
      expect(element.childNodes).toHaveLength(0)
    },
  }
}
