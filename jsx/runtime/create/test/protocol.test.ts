import {expect, test} from "bun:test"
import {component} from "@zavx0z/component"
import {jsx, Fragment, jsxs} from "@zavx0z/jsx/jsx-runtime"
import {textTemplate} from "../spec/fixture/index.ts"

test("jsxs передаёт native positional props и key", () => {
  const actual = jsxs(textTemplate, {text: "Несколько детей"}, "native")
  expect(actual.template).toBe(textTemplate)
  expect(actual.props).toEqual({text: "Несколько детей"})
  expect(actual.key).toBe("native")
})

test("Fragment сохраняет подготовленные siblings", () => {
  const children = [component(textTemplate, {text: "Первый"}), component(textTemplate, {text: "Второй"})]
  const actual = jsx(Fragment, {children})
  expect(actual.props).toEqual(children)
})
