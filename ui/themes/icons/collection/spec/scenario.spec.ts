/** uiIcons показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@ui-themes-icons/collection"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value, "Данные выражают публичный договор владельца").toHaveProperty("arrowUp")
  })
})
