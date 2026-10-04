import {describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import createJsxBunPlugin from "@immersive-jsx-compiler/bun"

describe.each([
  {name: "Сборка компонента", props: {cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [resolve(import.meta.dir, "fixture")]}},
])("$name", async ({props}) => {
  const plugin = createJsxBunPlugin(props)
  const actual = await Bun.build({
    entrypoints: [resolve(import.meta.dir, "fixture/plain.tsx")],
    plugins: [plugin],
    target: "bun",
    external: ["@immersive/template/compiled", "@immersive/component"],
  })
  const output = await actual.outputs[0]?.text()
  test("Результат сборки", () => {
    expect(actual.success, "Штатный Bun build получает скомпилированный компонент через публичный плагин").toBeTrue()
    expect(output, "Итоговая программа содержит готовый шаблон вместо авторского JSX").toContain("defineCompiledTemplate")
  })
})
