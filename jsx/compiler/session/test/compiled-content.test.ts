import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createDocument, createDomRoot as createRoot, domComponentConstructorBrand, HTMLButtonElement, type Document, type DOMComponentConstructor} from "@zavx0z/immersive-dom"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"

class PreparedChild extends HTMLButtonElement {
  static readonly [domComponentConstructorBrand] = true as const
  props: Readonly<{label: string}>
  content = {}
  constructor(document: Document, props: Readonly<{label: string}>) {
    super(document)
    this.props = props
    this.textContent = props.label
  }
  prepareUpdate(props: Readonly<{label: string}>) {
    const previous = this.textContent
    return {check: () => true, apply: () => { this.textContent = props.label }, rollback: () => { this.textContent = previous }, commit: () => { this.props = props }, insertion() {}, layout() {}, passive() {}}
  }
  update(props: Readonly<{label: string}>) { const plan = this.prepareUpdate(props); plan.apply(); plan.commit() }
  dispose() { this.remove() }
}
const child = PreparedChild
const component = <Props>(type: DOMComponentConstructor<Props>, props: Props, key: string | null = null) => ({type, props, key})

test("готовое содержимое в JSX сохраняет semantic identity и освобождает обычную область", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".compiled-"))
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})
  const document = createDocument()
  const root = createRoot(document)
  try {
    const result = await compiler.compileFile(join(import.meta.dir, "compiled-content.fixture.tsx"))
    const output = join(directory, "compiled.ts")
    await Bun.write(output, result.code)
    const {PreparedContent} = await import(pathToFileURL(output).href)
    root.render(PreparedContent, {content: component(child, {label: "Один"}, "same")})
    const button = document.querySelector("button")!
    expect(button.textContent).toBe("Один")
    root.render(PreparedContent, {content: component(child, {label: "Два"}, "same")})
    expect(document.querySelector("button")).toBe(button)
    expect(button.textContent).toBe("Два")
    root.render(PreparedContent, {content: null})
    expect(document.querySelector("button")).toBeNull()
    root.render(PreparedContent, {content: "Текст"})
    expect(document.querySelector("section")?.textContent).toBe("Текст")
  } finally {
    root.unmount()
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30_000)

test("prepared значения и primitive union используют общий child lifecycle также внутри component slot", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".compiled-union-"))
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})
  const document = createDocument()
  const root = createRoot(document)
  try {
    const result = await compiler.compileFile(join(import.meta.dir, "compiled-content.fixture.tsx"))
    const output = join(directory, "compiled.ts")
    await Bun.write(output, result.code)
    const {MixedPreparedContent, NestedPreparedContent} = await import(pathToFileURL(output).href)
    const contents = () => (document.querySelector("section") ?? document.querySelector("main"))!.textContent
    for (const host of [MixedPreparedContent, NestedPreparedContent]) {
      root.render(host, {content: component(child, {label: "A"}, "same")})
      const element = document.querySelector("button")!
      root.render(host, {content: component(child, {label: "B"}, "same")})
      expect(document.querySelector("button")).toBe(element)
      expect(element.textContent).toBe("B")
      for (const empty of [null, undefined, false, true]) {
        root.render(host, {content: empty})
        expect(document.querySelector("button")).toBeNull()
        expect(contents()).toBe("")
      }
      root.render(host, {content: "Текст"})
      expect(contents()).toBe("Текст")
      root.render(host, {content: 0})
      expect(contents()).toBe("0")
      root.render(host, {content: 42n})
      expect(contents()).toBe("42")
      root.render(host, {content: component(child, {label: "C"})})
      expect(document.querySelector("button")?.textContent).toBe("C")
    }
  } finally {
    root.unmount()
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

test("phantom marker не авторизует spoof и Partial ComponentValue", async () => {
  // Свежий процесс отделяет проверку типов от runtime imports готовых JSX-шаблонов.
  const probe = `
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"
const compiler = new JsxCompilerSession(${JSON.stringify({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})})
try {
  for (const path of ${JSON.stringify(["true", "false", "partial"].map(name => join(import.meta.dir, `compiled-content-invalid-${name}.fixture.tsx`)))}) {
    let rejected = false
    try { await compiler.compileFile(path) }
    catch (error) {
      if (!(error instanceof Error) || !error.message.includes("nominal ComponentValue")) throw error
      rejected = true
    }
    if (!rejected) throw new Error("Spoof accepted: " + path)
  }
} finally { await compiler.close() }
`
  const child = Bun.spawn([process.execPath, "--eval", probe], {cwd: resolve(import.meta.dir, ".."), stdout: "pipe", stderr: "pipe"})
  const [status, errors] = await Promise.all([child.exited, new Response(child.stderr).text()])
  expect(status, errors).toBe(0)
}, 30000)
