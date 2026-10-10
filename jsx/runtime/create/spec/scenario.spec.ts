import {expect, test} from "bun:test"
import jsx from "@zavx0z/immersive-jsx-runtime-create"
import {authoredComponent} from "./fixture/index.ts"

test("Авторский компонент проходит compiler до исполнения", () => {
  expect(() => jsx(authoredComponent, {text: "Содержимое"}, "text")).toThrow("предварительной компиляции")
})
