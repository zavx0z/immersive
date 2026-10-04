import {describe, expect, test} from "bun:test"
import jsx, {type RuntimeInput} from "@immersive-jsx-runtime/create"
import {slotContents} from "@immersive/template/compiled"
import {receiverTemplate, textTemplate} from "./fixture/index.ts"

describe.each([
  {name: "Готовый компонент", props: [textTemplate, {text: "Содержимое"}, "text"], expected: {text: "Содержимое"}, key: "text"},
  {name: "Пустые props", props: [textTemplate, null], expected: {}, key: null},
  {name: "Пустые именованные области", props: [receiverTemplate, null], expected: {[slotContents]: {header: [], "": []}}, key: null},
  {name: "Текст и ноль в default", props: [receiverTemplate, {children: ["Текст", 0, null]}], expected: {[slotContents]: {header: [], "": ["Текст", 0, null]}}, key: null},
])("$name", ({props, expected, key}: {props: RuntimeInput; expected: Record<PropertyKey, unknown>; key: string | null}) => {
  const actual = jsx(...props)

  test("Готовый template", () => {
    expect(actual.template, "Protocol сохраняет уже скомпилированный template вызывающего кода").toSatisfy(template => template === props[0])
  })
  test("Содержимое props", () => {
    expect(actual.props, "Обычные props сохраняются, а slot-вложенность получает группы compiler ABI").toEqual(expected)
  })
  test("Identity экземпляра", () => {
    expect(actual.key, "Native key становится ключом готового значения Component").toBe(key)
  })
})
