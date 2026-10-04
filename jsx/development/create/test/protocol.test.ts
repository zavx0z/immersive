import {expect, test} from "bun:test"
import {component} from "@immersive/component"
import {Fragment as RuntimeFragment} from "@immersive/jsx/jsx-runtime"
import {jsxDEV, Fragment} from "@immersive/jsx/jsx-dev-runtime"
import {textTemplate} from "../spec/fixture/index.ts"

test("Fragment identity едина с runtime", () => {
  expect(Fragment).toBe(RuntimeFragment)
  const children = [component(textTemplate, {text: "Первый"}), component(textTemplate, {text: "Второй"})]
  const actual = jsxDEV(Fragment, {children}, undefined, true)
  expect(actual.props).toEqual(children)
})
