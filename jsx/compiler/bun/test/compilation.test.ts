import {expect, spyOn, test} from "bun:test"
import {resolve} from "node:path"
import JsxCompilerSession from "@immersive-jsx-compiler/session"
import createJsxBunPlugin from "@immersive-jsx-compiler/bun"

test("Bun компилирует повторно без проверки контрактов и вывода предупреждений", async () => {
  const directory = resolve(import.meta.dir, "../spec/fixture")
  const session = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [directory]})
  const plugin = createJsxBunPlugin({session, sourceRoots: [directory], persistent: true})
  const warnings: unknown[][] = []
  const spy = spyOn(console, "warn").mockImplementation((...args) => { warnings.push(args) })
  try {
    const config = {
      entrypoints: [resolve(directory, "untyped.tsx")],
      plugins: [plugin],
      target: "bun" as const,
      external: ["@immersive/template/compiled", "@immersive/component", "@immersive/component/slot"],
    }
    expect((await Bun.build(config)).success).toBeTrue()
    expect((await Bun.build(config)).success).toBeTrue()
    expect(warnings).toEqual([])
    expect(session.stats.cacheHits).toBeGreaterThan(0)
  } finally {
    spy.mockRestore()
    await session.close()
  }
}, 30_000)
