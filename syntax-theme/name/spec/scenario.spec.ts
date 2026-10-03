/** activeSyntaxThemeName показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@ui-themes-syntax-theme/name"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value, "Данные выражают публичный договор владельца").toContain("Islands")
  })
})
