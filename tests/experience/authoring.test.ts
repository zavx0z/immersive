import {afterAll, beforeAll, expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {createDocument, createDomRoot, Event, HTMLButtonElement, type DOMComponent, type DOMComponentConstructor} from "@zavx0z/immersive-dom"
import {compile, html} from "@zavx0z/immersive-template"
import {createDocumentRenderer} from "@zavx0z/immersive-renderer-html"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"

type Props = {
  label: string
  disabled?: boolean | undefined
  lifecycle: {connected: number; disconnected: number}
  expose(update: (value: number) => void): void
}
let directory: string
let ready: {Counter: DOMComponentConstructor<Props>; Receiver: DOMComponentConstructor<{}>; Authored: DOMComponentConstructor<Props>}
const repository = resolve(import.meta.dir, "../..")

beforeAll(async () => {
  directory = await mkdtemp(join(repository, "tmp/unified-authoring-"))
  const built = await Bun.build({
    entrypoints: [join(import.meta.dir, "authoring.fixture.tsx")],
    outdir: directory,
    target: "bun",
    format: "esm",
    conditions: ["source"],
    external: ["@zavx0z/immersive-dom", "@zavx0z/immersive-dom/*"],
    plugins: [createJsxBunPlugin({cwd: repository, sourceRoots: [import.meta.dir]})],
    metafile: true,
  })
  expect(built.success, built.logs.map(String).join("\n")).toBeTrue()
  const inputs = Object.keys(built.metafile!.inputs)
  expect(inputs.filter(path => /(?:component\/src\/(?:runtime|composition)|XReact\/|template\/compiled)/u.test(path))).toEqual([])
  ready = await import(built.outputs.find(output => output.kind === "entry-point")!.path)
}, 30_000)

afterAll(async () => { if (directory) await rm(directory, {recursive: true, force: true}) })

for (const mode of ["imperative", "template", "jsx"] as const) {
  test(`один DOM и одно состояние элемента при ${mode} композиции`, () => {
    const document = createDocument()
    const host = document.createElement("div")
    const moved = document.createElement("aside")
    host.append(moved)
    document.append(host)
    const lifecycle = {connected: 0, disconnected: 0}
    let updateState!: (value: number) => void
    const props: Props = {label: "Счётчик", disabled: false, lifecycle, expose: value => { updateState = value }}
    let dispose: () => void
    let update: (props: Props) => void
    if (mode === "template") {
      const program = compile((value: Props) => html`<article>${{type: ready.Counter, props: value}}</article>`)
      const instance = program.mount(host, props)
      dispose = () => instance.dispose()
      update = next => instance.update(next)
    } else {
      const root = createDomRoot(host)
      root.render(mode === "jsx" ? ready.Authored : ready.Counter, props)
      dispose = () => root.unmount()
      update = next => root.render(mode === "jsx" ? ready.Authored : ready.Counter, next)
    }
    const counter = host.querySelector("button") as HTMLButtonElement & DOMComponent<Props>
    expect(counter).toBeInstanceOf(ready.Counter)
    expect(counter.ownerDocument).toBe(document)
    expect(counter.textContent).toBe("Счётчик:0")
    expect(lifecycle).toEqual({connected: 1, disconnected: 0})
    const renderer = createDocumentRenderer({document, root: host, viewport: {width: 400, height: 200}})
    try {
      counter.disabled = true
      expect(counter.props.disabled).toBeTrue()
      updateState(7)
      document.flushTasks()
      expect(counter.disabled).toBeTrue()
      expect(counter.textContent).toBe("Счётчик:7")
      expect(host.querySelector("button")).toBe(counter)
      const frame = renderer.flush()
      expect(frame.boxByNode.has(counter)).toBeTrue()
      counter.disabled = false
      counter.focus()
      const originalParent = counter.parentNode!
      const originalBefore = counter.nextSibling
      host.append(moved)
      moved.append(counter)
      expect(document.activeElement).toBe(counter)
      expect(lifecycle).toEqual({connected: 1, disconnected: 0})
      counter.dispatchEvent(new Event("click"))
      expect(counter.textContent).toBe("Счётчик:8")
      originalParent.insertBefore(counter, originalBefore)
      update({...props, label: "Новое", disabled: true})
      expect(counter.textContent).toBe("Новое:8")
      expect(counter.disabled).toBeTrue()
    } finally {
      renderer.dispose()
      dispose()
    }
    expect(lifecycle).toEqual({connected: 1, disconnected: 1})
  })
}
