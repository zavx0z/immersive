/** uiIcons показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-ui-theme/icon-set"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value, "Данные выражают публичный договор владельца").toHaveProperty("arrowUp")
  })
})
