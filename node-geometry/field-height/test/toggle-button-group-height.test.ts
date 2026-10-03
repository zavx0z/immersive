import {expect, test} from "bun:test"
import layout from "../src/toggle-button-group"

test("план Node сохраняет номинальную высоту строки кнопок базовой темы", () => {
  expect(layout.height()).toBe(22)
  expect(layout.height({density: "compact"})).toBe(22)
  expect(layout.height({label: true})).toBe(28)
})
