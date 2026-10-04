import {afterAll, describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import JsxCompilerSession from "@immersive-jsx-compiler/session"

describe.each([
  {name: "Компонент без слотов", file: "plain.tsx"},
  {name: "Слоты без ограничений", file: "untyped.tsx"},
  {name: "Явный контракт вложенности", file: "typed.tsx"},
])("$name", async ({file}) => {
  const props = {cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [resolve(import.meta.dir, "fixture")]}
  const session = new JsxCompilerSession(props)
  afterAll(() => session.close())
  const actual = await session.compileFile(resolve(import.meta.dir, "fixture", file))

  test("Готовый шаблон", () => {
    expect(actual.code, "Авторский компонент компилируется в общий исполняемый формат Template").toContain("defineCompiledTemplate")
    expect(actual.code, "Точка вставки компилируется в привязку и не создаёт DOM slot").not.toContain('createElement("slot")')
  })
  test("Разделение сборки и проверки", () => {
    expect(actual, "Компилятор возвращает готовый код, проверки контрактов принадлежат сценариям")
      .not.toHaveProperty("diagnostics")
  })
})
