import {expect, test} from "bun:test"
import {component} from "@zavx0z/component"
import {Fragment as RuntimeFragment} from "@zavx0z/jsx/jsx-runtime"
import {jsxDEV, Fragment} from "@zavx0z/jsx/jsx-dev-runtime"
import {textTemplate} from "../spec/fixture/index.ts"

test("Fragment identity едина с runtime", () => {
  expect(Fragment).toBe(RuntimeFragment)
  const children = [component(textTemplate, {text: "Первый"}), component(textTemplate, {text: "Второй"})]
  const actual = jsxDEV(Fragment, {children}, undefined, true)
  expect(actual.props).toEqual(children)
})
