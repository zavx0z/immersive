import {expect, test} from "bun:test"
import {parseCssTemplateShape} from "@immersive/template/css-shape"

test("пустой документ не задаёт CSS", () => {
  expect(() => parseCssTemplateShape([""]), "Шаблон требует декларацию, scoped rule или fragment").toThrow("at least one declaration")
})
