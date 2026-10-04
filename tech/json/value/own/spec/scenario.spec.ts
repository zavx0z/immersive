/** Собственная копия сохраняет JSON и не разделяет изменяемые объекты с источником. */
import {describe, expect, test} from "bun:test"
import own from "@immersive-tech-json-value/own"

describe.each([
  {name: "Вложенные значения", props: {value: {rows: [1, 2], enabled: true}, label: "Данные"}},
  {name: "Пустой массив", props: {value: {rows: [], enabled: false}, label: "Пустые данные"}},
])("$name", ({props}) => {
  const result = own(props.value, props.label)
  test("Копия и неизменяемость", () => {
    expect(result, "JSON-значение сохраняется").toEqual(props.value)
    expect(result, "Корневой объект принадлежит результату").not.toBe(props.value)
    expect(result.rows, "Вложенный массив также скопирован").not.toBe(props.value.rows)
    expect(Object.isFrozen(result) && Object.isFrozen(result.rows), "Вся вложенная структура заморожена").toBeTrue()
  })
  test("Недопустимое число", () => {
    expect(() => own(Number.NaN, props.label), "JSON не принимает нечисловое значение Number").toThrow("finite numbers")
  })
})
