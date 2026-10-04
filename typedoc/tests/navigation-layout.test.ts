import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@zavx0z/immersive-component"
import {createDocument, readDocumentScrollIntoViewRequests} from "@zavx0z/immersive-dom"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {TypeDocProps} from "../typedoc/index.tsx"
import type {TypeDocNavigationHandle} from "../typedoc/types/navigation.ts"
import {analyzeTypeDoc} from "../parser/index.ts"

const root = resolve(import.meta.dir, "../..")
Bun.plugin(createJsxBunPlugin({
  cwd: root,
  persistent: true,
  sourceRoots: ["typedoc", "markdown", "ui", "nodes"].map(path => resolve(root, path)),
}))
const {TypeDoc} = await import("../typedoc/index.tsx")

test("реальная вёрстка выбирает examples после ухода текста comment и summary за край", async () => {
  const parsed = await analyzeTypeDoc({root, path: resolve(root, "typedoc/parser/contract/output.ts")})
  const document = createDocument()
  const container = document.createElement("div")
  container.setAttribute("style", "display:flex;flex-direction:column;width:1150px;height:1030px;overflow:auto")
  document.append(container)
  const ready: {handle: TypeDocNavigationHandle | null} = {handle: null}
  const component = createRoot(container)
  component.render(TypeDoc as unknown as CompiledTemplate<TypeDocProps>, {
    document: parsed.document,
    onReady(value) { ready.handle = value },
  })
  const renderer = createDocumentRenderer({
    document,
    root: container,
    viewport: {width: 1150, height: 1030},
    styleSheets: [await Bun.file(resolve(root, "ui/theme/theme.css")).text()],
  })
  try {
    renderer.flush()
    const examples = container.querySelector('[data-typedoc-member="examples"]')!
    const summary = container.querySelector('[data-typedoc-member="summary"]')!
    const top = examples.getBoundingClientRect().top
    const gap = top - summary.getBoundingClientRect().bottom
    const position = top - container.getBoundingClientRect().top - gap / 2
    const requests = readDocumentScrollIntoViewRequests(document).length
    for (const delta of [0, 20, 40, 20, 0]) {
      container.scrollTop = position + delta
      renderer.flush()
      expect(ready.handle?.locate(container as unknown as Element)?.path.at(-1)).toBe("examples")
      expect(container.scrollTop).toBe(position + delta)
    }
    expect(readDocumentScrollIntoViewRequests(document)).toHaveLength(requests)
  } finally {
    renderer.dispose()
    component.unmount()
  }
})
