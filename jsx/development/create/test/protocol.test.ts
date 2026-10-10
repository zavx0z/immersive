import {expect, test} from "bun:test"
import {Fragment as RuntimeFragment} from "@zavx0z/immersive-jsx/jsx-runtime"
import {jsxDEV, Fragment} from "@zavx0z/immersive-jsx/jsx-dev-runtime"

test("Development сохраняет Fragment identity и обязательность compiler", () => {
  expect(Fragment).toBe(RuntimeFragment)
  expect(() => jsxDEV(Fragment, {children: []}, undefined, true)).toThrow("предварительной компиляции")
})
