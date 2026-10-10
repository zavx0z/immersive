import {expect, test} from "bun:test"

test("авторский namespace не создаёт runtime exports", async () => {
  const module = await import("../contract/authoring.ts")
  const compiler = await import("@zavx0z/immersive-jsx-compiler-session")
  expect(Object.keys(compiler).sort(), "Исполняемые экспорты принадлежат build-time compiler; JSX и nominal types стираются").toEqual(["createCompilerFileSystem", "default", "getAuthoringDeclarations"])
  expect(Object.keys(module), "JSX.Element и контракт слотов существуют только для TypeScript").toEqual([])
})
