import {expect, test} from "bun:test"
import {mkdtemp, readFile, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import createPlugin from "../index.ts"
import Session, {type JsxCompileResult} from "@zavx0z/immersive-jsx-compiler-session"

test("native onLoad компилирует transformed authoring .ts и test JSX по прежним governed paths", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".source-text-"))
  const sourcePath = join(directory, "scenario.test.tsx")
  const contextPath = join(directory, "context.ts")
  const source = 'export function Counter() { return <button>original</button> }\nexport const observed = "original"\n'
  await Bun.write(sourcePath, source)
  await Bun.write(contextPath, 'import {createContext} from "@zavx0z/immersive-component"\nexport const Context = createContext("original")\n')
  await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: "../../../../../tsconfig.json", include: ["*.ts", "*.tsx"]}))
  const session = new Session({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [directory]})
  const compiled: {path: string; source: string; result: JsxCompileResult}[] = []
  const handlers: {options: Parameters<Bun.PluginBuilder["onLoad"]>[0]; callback: Parameters<Bun.PluginBuilder["onLoad"]>[1]}[] = []
  const plugin = createPlugin({
    session, persistent: true, sourceRoots: [directory],
    sourceTransform: (_path, text) => text.replaceAll("original", "instrumented"),
    onCompiled: (path, source, result) => { compiled.push({path, source, result}) },
  })
  plugin.setup({onLoad(options, callback) {
    handlers.push({options, callback})
    return this
  }} as Bun.PluginBuilder)
  try {
    for (const path of [sourcePath, contextPath]) {
      const handler = handlers.find(handler => handler.options.filter.test(path))!
      expect(handler).toBeDefined()
      const result = await handler.callback({path, namespace: "file", loader: "tsx", defer: async () => {}})
      if (!result || !("contents" in result)) throw new Error("Native onLoad did not return source code")
      expect(result.contents).toContain("instrumented")
      expect(result.contents).not.toContain("<button>")
    }
    expect(compiled.map(entry => entry.path)).toEqual([sourcePath, contextPath])
    expect(compiled[0]!.source).toContain('observed = "instrumented"')
    expect(compiled[0]!.result.sourceRanges.length).toBeGreaterThan(0)
    expect(await readFile(sourcePath, "utf8")).toBe(source)
    expect(session.accepts(join(directory, "../foreign.tsx"))).toBeFalse()
  } finally {
    await session.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 30000)
