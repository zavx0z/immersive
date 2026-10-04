import {describe, expect, test} from "bun:test"
import jsxDEV, {type DevelopmentInput} from "@zavx0z/immersive-jsx-development-create"
import {textTemplate} from "./fixture/index.ts"

describe.each([
  {name: "Обычный development вызов", props: [textTemplate, {text: "Текст"}, "dev", false], expected: {text: "Текст"}, key: "dev"},
  {name: "Native source metadata", props: [textTemplate, {text: "Статические дети"}, undefined, true, {fileName: "example.tsx", lineNumber: 3, columnNumber: 5}, {debug: true}], expected: {text: "Статические дети"}, key: null},
])("$name", ({props, expected, key}: {props: DevelopmentInput; expected: Record<string, unknown>; key: string | null}) => {
  const actual = jsxDEV(...props)

  test("Готовый template", () => {
    expect(actual.template, "Development adapter использует тот же подготовленный template").toSatisfy(template => template === props[0])
  })
  test("Авторские props", () => {
    expect(actual.props, "Метаданные source и self относятся к protocol, автор получает свои props").toEqual(expected)
  })
  test("Native key", () => {
    expect(actual.key, "Undefined key нормализуется в обычное отсутствие ключа Component").toBe(key)
  })
})
