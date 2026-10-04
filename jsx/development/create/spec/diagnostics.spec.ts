import {expect, test} from "bun:test"
import jsxDEV from "@zavx0z/immersive-jsx-development-create"

test.each(["span", () => null, {}])("Development отклоняет неподготовленный template %p", type => {
  expect(() => jsxDEV(type, null, undefined, false), "Development protocol сохраняет границу предварительной компиляции").toThrow("скомпилированный компонент")
})
