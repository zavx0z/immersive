import {expect, test} from "bun:test"
import {mkdtemp, readFile, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {API} from "typescript/unstable/async"
import JsxCompilerSession, {createCompilerFileSystem} from "../index.ts"

test("native conditions profiles независимы: own source + ready sibling декларация без чтения sibling TSX", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".conditions-"))
  const source = join(directory, "consumer.tsx")
  const foreign = join(directory, "node_modules/ready-owner/source.tsx")
  const config = join(directory, "tsconfig.json")
  const configText = `{
    // JSONC сохраняет extends и trailing commas
    "extends": "../../../../../tsconfig.json",
    "compilerOptions": {"customConditions": ["source"],},
    "files": ["node_modules/ready-owner/source.tsx"],
    "include": ["**/*.tsx"],
  }`
  await Bun.write(config, configText)
  await Bun.write(source, 'import Ready from "ready-owner"\nexport function App() { return <Ready value="ready" /> }\n')
  await Bun.write(join(directory, "node_modules/ready-owner/package.json"), JSON.stringify({name: "ready-owner", type: "module", exports: {".": {source: "./source.tsx", types: "./index.d.ts", default: "./index.js"}}}))
  await Bun.write(foreign, 'export default function Ready(props: {value: string}) { return <button>{props.value}</button> }\n')
  await Bun.write(join(directory, "node_modules/ready-owner/index.d.ts"), 'import type {CompiledDOMComponent, JSX} from "@zavx0z/immersive-jsx-compiler-session"\ndeclare const Ready: CompiledDOMComponent<{value: string}, JSX.Element>\nexport default Ready\n')
  const cwd = resolve(import.meta.dir, "../../../..")
  const ready = new JsxCompilerSession({cwd, sourceRoots: [source], customConditions: [], sourceFiles: [source]})
  const authored = new JsxCompilerSession({cwd, sourceRoots: [source]})
  const fs = createCompilerFileSystem([], [source])
  const api = new API({cwd, fs})
  try {
    const first = await ready.compileFile(source)
    expect(first.code).toContain('from "ready-owner"')
    expect(await ready.compileFile(source)).toBe(first)
    const error = await authored.compileFile(source).then(() => null, error => error)
    expect(error).toBeInstanceOf(Error)
    expect(String(error)).toContain("does not resolve to a governed function component")
    expect(ready.accepts(foreign)).toBeFalse()
    const snapshot = await api.updateSnapshot({openFiles: [source]})
    try {
      const project = await snapshot.getDefaultProjectForFile(source)
      const files = await project!.program.getSourceFileNames()
      expect(files).toContain(join(directory, "node_modules/ready-owner/index.d.ts"))
      expect(files).not.toContain(foreign)
      expect(project!.compilerOptions.customConditions).toEqual([])
      expect(project!.rootFiles).toEqual([source])
    } finally { await snapshot.dispose() }
    expect(await readFile(config, "utf8")).toBe(configText)
    await rm(foreign)
    expect(await ready.compileFile(source)).toBe(first)
  } finally {
    await ready.close()
    await authored.close()
    await api.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)

test("config projection вставляет conditions в inherited/пустые compilerOptions", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".conditions-"))
  const config = join(directory, "tsconfig.json")
  try {
    const fs = createCompilerFileSystem(["browser"])!
    for (const text of ['{}', '{"extends":"./base.json",}', '{"compilerOptions":{}}', '{"compilerOptions":{"strict":true /* comment */}}']) {
      await Bun.write(config, text)
      expect(fs.readFile!(config)).toContain('"customConditions":["browser"]')
      expect(await readFile(config, "utf8")).toBe(text)
    }
    expect(fs.readFile!(join(directory, "package.json"))).toBeUndefined()
    expect(createCompilerFileSystem(undefined)).toBeUndefined()
  } finally { await rm(directory, {recursive: true, force: true}) }
})
