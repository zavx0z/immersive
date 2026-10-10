import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {mkdir, mkdtemp, rm, symlink} from "node:fs/promises"
import {createDocument} from "@zavx0z/immersive"
import {componentElement, createRoot} from "@zavx0z/immersive/XReact"
import {Button} from "@zavx0z/immersive/ui"
import {isCompiledTemplate, type CompiledTemplate} from "@zavx0z/immersive/XReact/compiled"
import createJsxBunPlugin from "@zavx0z/immersive/compiler"

const root = resolve(import.meta.dir, "..")
const ready = await Bun.file(resolve(root, "dist/browser.json")).json()

test("готовый DOM не загружает compiler, Template или Component", async () => {
  const metafile = await Bun.file(resolve(root, "dist/metafile.json")).json()
  const pending = [`./${ready.entries["@zavx0z/immersive"]}`]
  const visited = new Set<string>()
  const inputs = new Set<string>()
  while (pending.length) {
    const path = pending.pop()!
    if (visited.has(path)) continue
    visited.add(path)
    const output = metafile.outputs[path]
    expect(output).toBeDefined()
    for (const input of Object.keys(output.inputs)) inputs.add(input)
    for (const edge of output.imports) pending.push(edge.path)
  }
  expect(inputs.has("dom/src/document.ts")).toBe(true)
  expect([...inputs].filter(path => /^(component|template|jsx)\//u.test(path))).toEqual([])
})

test("внешние входы и source-preview разделяют готовый runtime", async () => {
  const source = Object.values(ready.sourceExports).flat().find((value: any) => value.specifier === "@zavx0z/immersive-component") as {file: string}
  expect(source).toBeDefined()
  const internal = await import(pathToFileURL(resolve(root, "dist", source.file)).href)
  expect(internal.createRoot).toBe(createRoot)
  const document = createDocument()
  const host = document.createElement("main")
  document.append(host)
  const mounted = createRoot(host)
  expect(isCompiledTemplate(Button)).toBe(true)
  const readyButton = Button as unknown as CompiledTemplate<{label: string}>
  mounted.render(readyButton, {label: "Готовый компонент"})
  const button = host.querySelector("button")!
  expect(button.textContent).toContain("Готовый компонент")
  mounted.render(readyButton, {label: "Обновлён"})
  expect(host.querySelector("button")).toBe(button)
  expect(button.ownerDocument).toBe(document)
  mounted.unmount()

  const ReadyButton = componentElement(Button, {initialProps: {label: "DOM"}})
  document.customElementRegistry.define("ready-button", ReadyButton)
  const custom = new ReadyButton()
  host.append(custom)
  const element = custom.querySelector("button")!
  expect(element.textContent).toContain("DOM")
  custom.props = {label: "После import()"}
  expect(custom.querySelector("button")).toBe(element)
  expect(element.textContent).toContain("После import()")
  custom.remove()
  expect(custom.childNodes).toHaveLength(0)
})

test("приложение компилирует собственный JSX со слотами готового Pane по declarations", async () => {
  await mkdir(resolve(root, "tmp"), {recursive: true})
  const directory = await mkdtemp(resolve(root, "tmp/ready-consumer-"))
  try {
    await mkdir(resolve(directory, "node_modules/@zavx0z"), {recursive: true})
    await symlink(root, resolve(directory, "node_modules/@zavx0z/immersive"), "dir")
    await Bun.write(resolve(directory, "package.json"), JSON.stringify({name: "@fixture/ready-consumer", type: "module"}))
    await Bun.write(resolve(directory, "tsconfig.json"), JSON.stringify({compilerOptions: {
      target: "ESNext", module: "Preserve", moduleResolution: "Bundler", jsx: "preserve",
      jsxImportSource: "@zavx0z/immersive/XReact", strict: true, noEmit: true, skipLibCheck: true,
    }, files: ["index.tsx"]}))
    await Bun.write(resolve(directory, "index.tsx"), `import {Pane, Typography} from "@zavx0z/immersive/ui"
export function Message(props: {body: string}) {
  return <Pane>
    <Typography text={props.body} />
  </Pane>
}
`)
    const built = await Bun.build({
      entrypoints: [resolve(directory, "index.tsx")], outdir: resolve(directory, "out"), target: "browser", format: "esm",
      external: ["@zavx0z/immersive", "@zavx0z/immersive/*"], metafile: true,
      plugins: [createJsxBunPlugin({cwd: directory, sourceRoots: [directory], styleSourceRootIds: ["@fixture/ready-consumer"]})],
    })
    expect(built.success).toBe(true)
    expect(Object.keys(built.metafile!.inputs)).toHaveLength(1)
    const {Message} = await import(pathToFileURL(built.outputs.find(output => output.kind === "entry-point")!.path).href)
    const document = createDocument()
    const host = document.createElement("main")
    document.append(host)
    const mounted = createRoot(host)
    try {
      mounted.render(Message, {body: "До обновления"})
      const pane = host.querySelector("section")!
      const text = pane.firstElementChild
      expect(pane.textContent).toBe("До обновления")
      mounted.render(Message, {body: "После обновления"})
      expect(host.querySelector("section")).toBe(pane)
      expect(pane.firstElementChild).toBe(text)
      expect(pane.textContent).toBe("После обновления")
    } finally { mounted.unmount() }
  } finally { await rm(directory, {recursive: true, force: true}) }
}, 60000)

test("императивный потребитель проверяет публичные типы без JSX, Bun globals и skipLibCheck", async () => {
  await mkdir(resolve(root, "tmp"), {recursive: true})
  const directory = await mkdtemp(resolve(root, "tmp/ready-types-"))
  try {
    await mkdir(resolve(directory, "node_modules/@zavx0z"), {recursive: true})
    await symlink(root, resolve(directory, "node_modules/@zavx0z/immersive"), "dir")
    await Bun.write(resolve(directory, "package.json"), JSON.stringify({name: "@fixture/ready-types", type: "module"}))
    await Bun.write(resolve(directory, "index.ts"), `import {createDocument} from "@zavx0z/immersive"
import {createRoot} from "@zavx0z/immersive/XReact"
import {Pane} from "@zavx0z/immersive/ui"
const document = createDocument()
const root = createRoot(document.createElement("main"))
const paragraph = document.createElement("p")
root.render(Pane, {variant: "outlined"}, {content: {"": paragraph}})
`)
    const config = resolve(directory, "tsconfig.json")
    await Bun.write(config, JSON.stringify({compilerOptions: {
      target: "ESNext", module: "Preserve", moduleResolution: "Bundler", lib: ["ESNext", "DOM", "DOM.Iterable"],
      types: [], strict: true, noEmit: true, skipLibCheck: false,
    }, files: ["index.ts"]}))
    const process = Bun.spawn([resolve(root, "node_modules/.bin/tsc"), "--project", config, "--pretty", "false"], {stdout: "pipe", stderr: "pipe"})
    const [code, stdout, stderr] = await Promise.all([process.exited, new Response(process.stdout).text(), new Response(process.stderr).text()])
    expect(code, `${stdout}${stderr}`).toBe(0)
  } finally { await rm(directory, {recursive: true, force: true}) }
}, 60000)
