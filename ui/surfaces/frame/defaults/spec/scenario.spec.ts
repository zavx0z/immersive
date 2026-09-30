/** frameDefaultProps показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@ui-surfaces-frame/defaults"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value.title, "Данные выражают публичный договор владельца").toBe("Frame")
  })
})
