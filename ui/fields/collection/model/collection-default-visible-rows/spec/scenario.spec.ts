/** COLLECTION_DEFAULT_VISIBLE_ROWS показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@ui-fields-collection-model/collection-default-visible-rows"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value, "Данные выражают публичный договор владельца").toBe(3)
  })
})
