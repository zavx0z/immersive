/** Равенство учитывает структуру, порядок элементов и семантику чисел. */
import {describe, expect, test} from "bun:test"
import equal from "@zavx0z/immersive-tech-json-value-equal"

describe.each([
  {name: "Одинаковая структура", props: {left: {items: [1, 2]}, right: {items: [1, 2]}}, expected: true},
  {name: "Другой порядок", props: {left: {items: [1, 2]}, right: {items: [2, 1]}}, expected: false},
  {name: "Разный знак нуля", props: {left: {items: [0]}, right: {items: [-0]}}, expected: false},
])("$name", ({props, expected}) => {
  const result = equal(props.left, props.right)
  test("Структурное сравнение", () => {
    expect(result, "Сравнение не зависит от identity объектов").toBe(expected)
  })
})
