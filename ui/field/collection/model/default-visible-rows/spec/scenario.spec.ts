/** COLLECTION_DEFAULT_VISIBLE_ROWS показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import value from "@zavx0z/immersive-ui-field-collection-model-default-visible-rows"

describe.each([{name: "Публичное значение", props: {}}])("$name", () => {
  test("Данные", () => {
    expect(value, "Данные выражают публичный договор владельца").toBe(3)
  })
})
