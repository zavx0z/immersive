import {expect, test} from "bun:test"
import {Color, GlassMaterial} from "../src/index"

test("GlassMaterial сохраняет tint/alpha API и проверяет параметры оболочки перед upload", () => {
  const tint = new Color(.3, .6, .8, .1)
  const material = new GlassMaterial({tintColor: tint})
  expect(material.tintColor).toBe(tint)
  expect(material).toMatchObject({thickness: 1, ior: 1.5, roughness: .25})
  for (const parameters of [{thickness: NaN}, {thickness: -1}, {ior: Infinity}, {ior: .5}, {roughness: 0}]) expect(() => new GlassMaterial(parameters)).toThrow(RangeError)
  material.tintColor.a = NaN
  expect(() => material.validate()).toThrow(RangeError)
})
