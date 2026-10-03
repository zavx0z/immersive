/** Версия и идентификатор переносимого типа проверяются до публикации копии. */
import {describe, expect, test} from "bun:test"
import ownType from "@node-values/type"

describe.each([
  {name: "Первая версия", props: {value: {id: "number", version: 1}}},
  {name: "Следующая версия", props: {value: {id: "record", version: 2}}},
])("$name", ({props}) => {
  const result = ownType(props.value)
  test("Идентичность типа", () => {
    expect(result, "Смысл идентификатора и версии сохранён").toEqual(props.value)
    expect(result, "Копия не заимствует изменяемый объект").not.toBe(props.value)
    expect(Object.isFrozen(result), "Опубликованная идентичность неизменяема").toBeTrue()
  })
  test("Недопустимая версия", () => {
    expect(() => ownType({...props.value, version: 0}), "Версия должна быть положительной").toThrow("positive safe integer")
  })
})
