import {expect, test} from "bun:test"

test("авторский namespace не создаёт runtime exports", async () => {
  const module = await import("@jsx/types")
  expect(Object.keys(module), "JSX.Element и контракт слотов существуют только для TypeScript").toEqual([])
})
