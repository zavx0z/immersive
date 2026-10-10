import {expect, test} from "bun:test"
import jsx from "@zavx0z/immersive-jsx-runtime-create"

test.each(["span", () => null, {}])("Неподготовленный JSX %p", type => {
  expect(() => jsx(type, null)).toThrow("предварительной компиляции")
})
