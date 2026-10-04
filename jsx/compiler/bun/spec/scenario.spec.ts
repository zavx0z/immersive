import {describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"

describe.each([
  {name: "Сборка компонента", props: {cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [resolve(import.meta.dir, "fixture")]}},
])("$name", async ({props}) => {
  const plugin = createJsxBunPlugin(props)
  const actual = await Bun.build({
    entrypoints: [resolve(import.meta.dir, "fixture/plain.tsx")],
    plugins: [plugin],
    target: "bun",
    external: ["@zavx0z/immersive-template/compiled", "@zavx0z/immersive-component"],
  })
  const output = await actual.outputs[0]?.text()
  test("Результат сборки", () => {
    expect(actual.success, "Штатный Bun build получает скомпилированный компонент через публичный плагин").toBeTrue()
    expect(output, "Итоговая программа содержит готовый шаблон вместо авторского JSX").toContain("defineCompiledTemplate")
  })
})
