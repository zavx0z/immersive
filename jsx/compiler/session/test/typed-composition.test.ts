import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createDocument} from "@zavx0z/dom"
import {createRoot} from "@zavx0z/component"
import JsxCompilerSession from "@jsx-compiler/session"

test("типизированная передача через два получателя сохраняет keyed identity и nullable footer", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".compiled-"))
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})
  const document = createDocument()
  const root = createRoot(document)
  try {
    const result = await compiler.compileFile(join(import.meta.dir, "typed-composition.fixture.tsx"))
    expect(result.diagnostics).toEqual([])
    const output = join(directory, "compiled.ts")
    await Bun.write(output, result.code)
    const {TypedComposition} = await import(pathToFileURL(output).href)
    root.render(TypedComposition, {rows: ["a", "b"], show: true})
    expect(document.querySelector("header")?.textContent).toBe("Действия")
    const a = document.querySelector('[data-action="a"]')!
    const b = document.querySelector('[data-action="b"]')!
    expect(document.querySelector("footer")?.textContent).toBe("footer")
    root.render(TypedComposition, {rows: ["b", "a"], show: false})
    expect([...document.querySelector("main")!.children]).toEqual([b, a])
    expect(document.querySelector("footer")?.textContent).toBe("")
  } finally {
    root.unmount()
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30_000)
