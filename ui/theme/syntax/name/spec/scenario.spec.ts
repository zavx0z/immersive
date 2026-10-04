/** activeSyntaxThemeName показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@immersive-ui-theme-syntax/name"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value, "Данные выражают публичный договор владельца").toContain("Islands")
  })
})
