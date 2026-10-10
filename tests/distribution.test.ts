import {expect, test} from "bun:test"
import {dirname, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {mkdir, mkdtemp, rm, symlink} from "node:fs/promises"
import {createDocument, createDomRoot, HTMLButtonElement, Event, isDOMComponentConstructor} from "../dist/index.js"
import {Button} from "../dist/ui/component/index.js"
import createJsxBunPlugin from "@zavx0z/immersive/compiler"
import {createCompilerFileSystem} from "@zavx0z/immersive/compiler/session"
import {API} from "typescript/unstable/async"
import {isBuiltin} from "node:module"

const root = resolve(import.meta.dir, "..")
const ready = await Bun.file(resolve(root, "dist/browser.json")).json()

test("producer собирает core один раз, а каждый ready компонент отдельным entry", async () => {
  const metafile = await Bun.file(resolve(root, "dist/metafile.json")).json()
  const builds = metafile.builds as {entrypoints: string[], sourceRoots: string[], splitting: boolean}[]
  expect(builds).toBeDefined()
  expect(builds.filter(build => build.splitting)).toHaveLength(1)
  expect(builds[0]!.sourceRoots).toEqual([])
  const publicSources = new Set<string>(Object.values(ready.sourceExports).flat().map((entry: any) => entry.source))
  for (const build of builds.filter(build => !build.splitting)) {
    expect(build.entrypoints).toHaveLength(1)
    const entry = build.entrypoints[0]!
    const output = metafile.outputs[`./${entry.replace(/\.[cm]?tsx?$/u, ".js")}`]
    expect(output).toBeDefined()
    expect(Object.keys(output.inputs).filter(input => publicSources.has(input) && input !== entry)).toEqual([])
    expect(build.sourceRoots.every(path => Object.hasOwn(output.inputs, path))).toBe(true)
  }
  expect(builds.some(build => build.entrypoints.includes("ui/component/button/basic/index.tsx") && !build.splitting)).toBe(true)
})

test("own source profile использует только ready declarations чужих владельцев", async () => {
  const owner = async (file: string) => {
    let directory = dirname(file)
    while (directory.startsWith(`${root}/`)) {
      if (await Bun.file(resolve(directory, "package.json")).exists()) return directory
      directory = dirname(directory)
    }
    return root
  }
  for (const entry of ["ui/component/button/basic/index.tsx", "ui/component/field/color/index.tsx", "ui/component/view/code-editor/index.tsx", "nodes/editor/index.tsx"]) {
    const source = resolve(root, entry)
    const owningDirectory = await owner(source)
    const api = new API({cwd: root, fs: createCompilerFileSystem([], [source])!})
    const snapshot = await api.updateSnapshot({openFiles: [source]})
    try {
      const project = await snapshot.getDefaultProjectForFile(source)
      expect(project!.rootFiles).toEqual([source])
      expect(project!.compilerOptions.customConditions).toEqual([])
      expect(await project!.program.getSemanticDiagnostics(), entry).toEqual([])
      const files = (await project!.program.getSourceFileNames()).filter(path => /\.[cm]?tsx?$/u.test(path) && !/\.d\.[cm]?ts$/u.test(path))
      const foreign = []
      for (const file of files) if (!file.startsWith(`${root}/`) || await owner(file) !== owningDirectory) foreign.push(file)
      expect(foreign, entry).toEqual([])
    } finally { await snapshot.dispose(); await api.close() }
  }
}, 60000)

test("готовые DOM и UI не загружают XReact, compiler, Template или Component", async () => {
  const metafile = await Bun.file(resolve(root, "dist/metafile.json")).json()
  const pending = ["@zavx0z/immersive", "@zavx0z/immersive/ui"].map(specifier => `./${ready.entries[specifier]}`)
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
  expect(inputs.has("dom/root/index.ts")).toBe(true)
  expect([...inputs].filter(path => /^(component|template|jsx|XReact|compiler)\//u.test(path))).toEqual([])
  expect(Object.keys(ready.entries).filter(specifier => /\/XReact(?:\/|$)|\/compiler(?:\/|$)/u.test(specifier))).toEqual([])
})

test("ready compiler замкнут на тот же готовый core и не зависит от source conditions", async () => {
  const browser = await Bun.file(resolve(root, "dist/metafile.json")).json()
  const tools = await Bun.file(resolve(root, "dist/server-metafile.json")).json()
  expect(browser.toolFiles.length).toBeGreaterThan(0)
  for (const file of browser.toolFiles) {
    expect(Bun.CryptoHasher.hash("sha256", await Bun.file(resolve(root, "dist", file.path)).arrayBuffer()).toString("hex"), file.path).toBe(file.digest)
  }
  const outputs = {...browser.outputs, ...tools.outputs}
  const pending = ["./compiler/index.js", "./jsx/compiler/session/index.js"]
  const visited = new Set<string>()
  let nodeImplementations = 0
  while (pending.length) {
    const path = pending.pop()!
    if (visited.has(path)) continue
    visited.add(path)
    const output = outputs[path]
    expect(output, path).toBeDefined()
    if (Object.hasOwn(output.inputs, "dom/src/node.ts")) nodeImplementations++
    if (Object.hasOwn(tools.outputs, path)) expect(Object.keys(output.inputs).filter(input => input.startsWith("dom/"))).toEqual([])
    for (const edge of output.imports) {
      if (edge.external) expect(isBuiltin(edge.path) || /^(?:bun:|typescript(?:\/|$))/u.test(edge.path)).toBe(true)
      else pending.push(edge.path)
    }
    const imports = new Bun.Transpiler({loader: "js"}).scanImports(await Bun.file(resolve(root, "dist", path)).text())
    expect(imports.filter(edge => !isBuiltin(edge.path) && !/^(?:\.{1,2}\/|bun:|typescript(?:\/|$))/u.test(edge.path))).toEqual([])
    expect(imports.filter(edge => /\.[cm]?tsx?$/u.test(edge.path))).toEqual([])
  }
  // Compiler может обходиться без Node вовсе: он выпускает ссылки на готовый
  // core, а не исполняет DOM при генерации. Загруженная копия допускается одна.
  expect(nodeImplementations).toBeLessThanOrEqual(1)
})

test("внешние входы и source-preview разделяют готовый runtime", async () => {
  const source = Object.values(ready.sourceExports).flat().find((value: any) => value.specifier === "@zavx0z/immersive-dom") as {file: string}
  expect(source).toBeDefined()
  const internal = await import(pathToFileURL(resolve(root, "dist", source.file)).href)
  expect(internal.createDomRoot).toBe(createDomRoot)
  expect(internal.createDocument).toBe(createDocument)
  const buttonSource = Object.values(ready.sourceExports).flat().find((value: any) => value.source === "ui/component/button/basic/index.tsx") as {file: string}
  expect(buttonSource).toBeDefined()
  expect((await import(pathToFileURL(resolve(root, "dist", buttonSource.file)).href)).default).toBe(Button)
  const document = createDocument()
  const host = document.createElement("main")
  document.append(host)
  const mounted = createDomRoot(host)
  expect(isDOMComponentConstructor(Button)).toBe(true)
  mounted.render(Button, {label: "Готовый компонент"})
  const button = host.querySelector("button")!
  expect(button).toBeInstanceOf(Button)
  expect(button).toBeInstanceOf(HTMLButtonElement)
  expect(host.children).toEqual([button])
  expect(button.textContent).toContain("Готовый компонент")
  mounted.render({type: Button, props: {label: "Обновлён"}})
  expect(host.querySelector("button")).toBe(button)
  expect(button.ownerDocument).toBe(document)
  mounted.unmount()
  expect(host.children).toHaveLength(0)

  document.customElementRegistry.define("ready-button", Button, {extends: "button"})
  expect(document.customElementRegistry.get("ready-button")).toBe(Button)
  const custom = document.createElement("button", {is: "ready-button"}) as InstanceType<typeof Button>
  expect(custom).toBeInstanceOf(Button)
  expect(custom).toBeInstanceOf(HTMLButtonElement)
  expect(custom.localName).toBe("button")
  expect(custom.childNodes).toHaveLength(0)
  custom.props = {label: "DOM"}
  host.append(custom)
  expect(custom.querySelector("button")).toBeNull()
  expect(host.children).toEqual([custom])
  expect(custom.textContent).toContain("DOM")
  const label = custom.firstChild
  custom.props = {label: "После import()"}
  expect(custom.firstChild).toBe(label)
  expect(custom.textContent).toContain("После import()")
  custom.dispose()
  expect(host.children).toHaveLength(0)
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
import {useState, useLayoutEffect} from "@zavx0z/immersive/XReact"
function Increment(props: {onIncrement(): void}) {
  return <button data-increment="" onClick={props.onIncrement} />
}
export function Message(props: {body: string, mount(): void, cleanup(): void}) {
  const [count, setCount] = useState(0)
  useLayoutEffect(() => { props.mount(); return props.cleanup }, [])
  return <Pane>
    <Typography text={props.body + ":" + count} />
    <Increment onIncrement={() => setCount(value => value + 1)} />
  </Pane>
}
`)
    const built = await Bun.build({
      entrypoints: [resolve(directory, "index.tsx")], outdir: resolve(directory, "out"), target: "browser", format: "esm",
      external: ["@zavx0z/immersive", "@zavx0z/immersive/*"], metafile: true,
      plugins: [createJsxBunPlugin({cwd: directory, sourceRoots: [directory], sourceFiles: [resolve(directory, "index.tsx")], customConditions: [], styleSourceRootIds: ["@fixture/ready-consumer"]})],
    })
    expect(built.success).toBe(true)
    expect(Object.keys(built.metafile!.inputs)).toHaveLength(1)
    const entry = built.outputs.find(output => output.kind === "entry-point")!
    const emitted = await entry.text()
    expect(new Bun.Transpiler({loader: "js"}).scanImports(emitted).map(edge => edge.path))
      .toEqual(expect.arrayContaining(["@zavx0z/immersive", "@zavx0z/immersive/ui"]))
    expect(emitted).not.toMatch(/from ["']@zavx0z\/immersive\/XReact(?:\/|["'])/u)
    const {Message} = await import(pathToFileURL(entry.path).href)
    expect(isDOMComponentConstructor(Message)).toBe(true)
    const document = createDocument()
    const host = document.createElement("main")
    document.append(host)
    const mounted = createDomRoot(host)
    let mounts = 0, cleanups = 0
    const effects = {mount() {mounts++}, cleanup() {cleanups++}}
    try {
      mounted.render(Message, {body: "До обновления", ...effects})
      const pane = host.querySelector("section")!
      const text = pane.firstElementChild
      expect(pane.textContent).toBe("До обновления:0")
      pane.querySelector("button")!.dispatchEvent(new Event("click"))
      mounted.flush()
      expect(pane.textContent).toBe("До обновления:1")
      mounted.render(Message, {body: "После обновления", ...effects})
      expect(host.querySelector("section")).toBe(pane)
      expect(pane.firstElementChild).toBe(text)
      expect(pane.textContent).toBe("После обновления:1")
      const beside = document.createElement("aside")
      host.append(beside)
      beside.append(pane)
      expect(beside.firstChild).toBe(pane)
      expect(pane.firstElementChild).toBe(text)
      expect(pane.textContent).toBe("После обновления:1")
      expect([mounts, cleanups]).toEqual([1, 0])
    } finally { mounted.unmount() }
    expect([mounts, cleanups]).toEqual([1, 1])
  } finally { await rm(directory, {recursive: true, force: true}) }
}, 60000)

test("императивный потребитель проверяет публичные типы без JSX, Bun globals и skipLibCheck", async () => {
  await mkdir(resolve(root, "tmp"), {recursive: true})
  const directory = await mkdtemp(resolve(root, "tmp/ready-types-"))
  try {
    await mkdir(resolve(directory, "node_modules/@zavx0z"), {recursive: true})
    await symlink(root, resolve(directory, "node_modules/@zavx0z/immersive"), "dir")
    await Bun.write(resolve(directory, "package.json"), JSON.stringify({name: "@fixture/ready-types", type: "module"}))
    await Bun.write(resolve(directory, "index.ts"), `import {createDocument, createDomRoot, createRoot, inspectRoot, isDOMComponentConstructor, type DOMConstruction} from "@zavx0z/immersive"
import {Pane, Button} from "@zavx0z/immersive/ui"
const document = createDocument()
const root = createDomRoot(document.createElement("main"))
const paragraph = document.createElement("p")
root.render(Pane, {variant: "outlined"}, {content: {"": paragraph}})
const construction: DOMConstruction<NonNullable<ConstructorParameters<typeof Pane>[1]>> = {type: Pane, props: {variant: "outlined"}, content: {"": paragraph}}
root.render(construction)
root.flush()
root.readStyleSheets().styleSheets.map(sheet => sheet.source?.kind === "authored-css" ? sheet.source.componentName : "")
const instance = new Pane(document, {variant: "outlined"}, {"": paragraph})
instance.props = {variant: "outlined"}
instance.content = {"": paragraph}
instance.update({variant: "outlined"})
instance.dispose()
document.customElementRegistry.define("ready-button", Button, {extends: "button"})
const canvas = globalThis.document.createElement("canvas")
const browser = createRoot(canvas)
browser.render(construction)
inspectRoot(browser).whenReady()
isDOMComponentConstructor(Button)
root.unmount()
`)
    const config = resolve(directory, "tsconfig.json")
    await Bun.write(config, JSON.stringify({compilerOptions: {
      target: "ESNext", module: "Preserve", moduleResolution: "Bundler", lib: ["ESNext", "DOM", "DOM.Iterable"],
      types: [], strict: true, noEmit: true, skipLibCheck: false,
    }, files: ["index.ts"]}))
    const process = Bun.spawn([resolve(root, "node_modules/.bin/tsc"), "--project", config, "--pretty", "false"], {stdout: "pipe", stderr: "pipe"})
    const [code, stdout, stderr] = await Promise.all([process.exited, new Response(process.stdout).text(), new Response(process.stderr).text()])
    expect(code, `${stdout}${stderr}`).toBe(0)
    const listing = Bun.spawn([resolve(root, "node_modules/.bin/tsc"), "--project", config, "--listFilesOnly", "--pretty", "false"], {stdout: "pipe", stderr: "pipe"})
    const [listedCode, listed, listedErrors] = await Promise.all([listing.exited, new Response(listing.stdout).text(), new Response(listing.stderr).text()])
    expect(listedCode, listedErrors).toBe(0)
    expect(listed.split(/\r?\n/u).filter(path => path !== resolve(directory, "index.ts") && /\.[cm]?tsx?$/u.test(path) && !/\.d\.[cm]?ts$/u.test(path))).toEqual([])
  } finally { await rm(directory, {recursive: true, force: true}) }
}, 60000)

test("выбор одного entry переиспользует готовые core/siblings и их source identity", async () => {
  const before = await Bun.file(resolve(root, "dist/browser.json")).json()
  const prior = await Bun.file(resolve(root, "dist/metafile.json")).json()
  const process = Bun.spawn(["bun", "run", "build", "--entry", "@zavx0z/immersive/ui/button/basic"], {
    cwd: root, env: {...Bun.env, BUN_OPTIONS: ""}, stdout: "pipe", stderr: "pipe",
  })
  const [code, stdout, stderr] = await Promise.all([process.exited, new Response(process.stdout).text(), new Response(process.stderr).text()])
  expect(code, `${stdout}${stderr}`).toBe(0)
  const after = await Bun.file(resolve(root, "dist/browser.json")).json()
  const selected = "ui/component/button/basic/index.tsx"
  expect(after.entries).toEqual(before.entries)
  expect(after.sourceExports).toEqual(before.sourceExports)
  expect(after.files.filter((file: {path: string}) => !file.path.startsWith("ui/component/button/basic/index.js")))
    .toEqual(before.files.filter((file: {path: string}) => !file.path.startsWith("ui/component/button/basic/index.js")))
  const metafile = await Bun.file(resolve(root, "dist/metafile.json")).json()
  expect(metafile.builds).toHaveLength(prior.builds.length)
  expect(metafile.toolFiles).toEqual(prior.toolFiles)
  expect(metafile.builds.at(-1)).toEqual({entrypoints: [selected], sourceRoots: [selected], splitting: false})
  expect(metafile.builds.filter((build: {entrypoints: string[]}) => !build.entrypoints.includes(selected)))
    .toEqual(prior.builds.filter((build: {entrypoints: string[]}) => !build.entrypoints.includes(selected)))
  expect(stdout).toContain("selected distribution; 1 independent entries")
  expect(stdout).not.toContain("Immersive core:")
}, 120000)
