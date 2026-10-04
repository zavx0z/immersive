import {expect, test} from "bun:test"

test("авторский namespace не создаёт runtime exports", async () => {
  const module = await import("../contract/authoring.ts")
  const compiler = await import("@immersive-jsx-compiler/session")
  expect(Object.keys(compiler), "Контракт автора не добавляет runtime-экспортов к реализации компилятора").toEqual(["default"])
  expect(Object.keys(module), "JSX.Element и контракт слотов существуют только для TypeScript").toEqual([])
})
