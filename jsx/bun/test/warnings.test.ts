import {expect, spyOn, test} from "bun:test"
import {resolve} from "node:path"
import {JsxCompilerSession} from "@jsx/compiler"
import {createJsxBunPlugin} from "@jsx/bun"

test("Bun выводит рекомендацию типов один раз при повторной сборке из кеша", async () => {
  const directory = resolve(import.meta.dir, "../spec/fixture")
  const session = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../.."), sourceRoots: [directory]})
  const plugin = createJsxBunPlugin({session, sourceRoots: [directory], persistent: true})
  const warnings: unknown[][] = []
  const spy = spyOn(console, "warn").mockImplementation((...args) => { warnings.push(args) })
  try {
    const config = {
      entrypoints: [resolve(directory, "untyped.tsx")],
      plugins: [plugin],
      target: "bun" as const,
      external: ["@zavx0z/template/compiled", "@zavx0z/component", "@zavx0z/component/slot"],
    }
    expect((await Bun.build(config)).success).toBeTrue()
    expect((await Bun.build(config)).success).toBeTrue()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]![0]).toContain("JSX-SLOTS-UNTYPED")
    expect(warnings[0]![0]).toContain("Panel")
    expect(session.stats.cacheHits).toBeGreaterThan(0)
  } finally {
    spy.mockRestore()
    await session.close()
  }
}, 30_000)
