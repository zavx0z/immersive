/** Данные примера принадлежат сценарию временной шкалы. */
import {describe, expect, test} from "bun:test"
import value from "../spec/fixture/default-props"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value.title, "Данные выражают публичный договор владельца").toBe("Timeline")
  })
})
