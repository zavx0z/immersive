import {describe, expect, test} from "bun:test"
import {parseCssTemplateShape} from "@immersive/template/css-shape"

describe.each([
  {name: "Статическая декларация", props: ["color: red;"], count: 1, slots: 0},
  {name: "Динамическое значение", props: ["width: ", "px;"], count: 1, slots: 1},
])("$name", ({props, count, slots}) => {
  const actual = parseCssTemplateShape(props)
  test("Структура шаблона", () => {
    expect({rules: actual.rules.length, slots: actual.slotCount}, "Статика определяет CSS-правила; интерполяции остаются адресуемыми позициями").toEqual({rules: count, slots})
  })
})
