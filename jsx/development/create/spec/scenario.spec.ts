import {expect, test} from "bun:test"
import jsxDEV from "@zavx0z/immersive-jsx-development-create"
import {authoredComponent} from "./fixture/index.ts"

test("Development metadata не включает отдельный runtime", () => {
  expect(() => jsxDEV(authoredComponent, {text: "Текст"}, "key", false, {fileName: "example.tsx", lineNumber: 3}, {})).toThrow("предварительной компиляции")
})
