import {afterAll, describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import {JsxCompilerSession} from "@jsx/compiler"

describe.each([
  {name: "Компонент без слотов", file: "plain.tsx", warnings: 0},
  {name: "Слоты без ограничений", file: "untyped.tsx", warnings: 1},
  {name: "Явный контракт вложенности", file: "typed.tsx", warnings: 0},
])("$name", async ({file, warnings}) => {
  const props = {cwd: resolve(import.meta.dir, "../../.."), sourceRoots: [resolve(import.meta.dir, "fixture")]}
  const session = new JsxCompilerSession(props)
  afterAll(() => session.close())
  const actual = await session.compileFile(resolve(import.meta.dir, "fixture", file))

  test("Готовый шаблон", () => {
    expect(actual.code, "Авторский компонент компилируется в общий исполняемый формат Template").toContain("defineCompiledTemplate")
    expect(actual.code, "Точка вставки компилируется в привязку и не создаёт DOM slot").not.toContain('createElement("slot")')
  })
  test("Рекомендация типов", () => {
    expect(actual.diagnostics.length, "Предупреждение относится только к компоненту с неописанными слотами и не запрещает компиляцию").toBe(warnings)
  })
  /** @remarks У компонента без слотов и с явной схемой нет причины предупреждать. */
  describe.skipIf(warnings === 0)("Необязательная схема", () => {
    test("Источник предупреждения", () => {
      expect(actual.diagnostics[0], "Сообщение указывает объявление получателя и устойчивую причину").toMatchObject({code: "JSX-SLOTS-UNTYPED", component: "Panel", file: resolve(import.meta.dir, "fixture", file)})
    })
  })
})
