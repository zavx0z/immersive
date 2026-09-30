/** clearIcon показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import icon from "@ui-themes-icons/clear"

describe.each([{name: "Векторный ресурс", props: {}}])("$name", () => {
  test("SVG", () => {
    expect(icon, "Значок передаётся как встроенный SVG data URL").toStartWith("data:image/svg+xml")
    expect(decodeURIComponent(icon), "Ресурс содержит векторный источник").toContain("<svg")
  })
})
