import {describe, expect, test} from "bun:test"
import Fragment from "@jsx-runtime/fragment"

describe.each([
  {name: "Группа соседних значений", props: {}},
])("$name", () => {
  const actual = Fragment

  test("Маркер группы", () => {
    expect(typeof actual, "Fragment является символом, а не исполняемым компонентом").toBe("symbol")
  })
  test("Устойчивое имя", () => {
    expect(actual.description, "Имя объясняет назначение общего маркера").toBe("JSX.Fragment")
  })
})
