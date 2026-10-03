/** Политика высоты использует подготовленное представление, не читая DOM. */
import {describe, expect, test} from "bun:test"
import height from "@node-geometry/field-height"
import present from "@nodes/parameter-presentation"

describe.each([
  {name: "Число", props: present({id: "value", revision: 0, value: 1, presentation: {}}), expected: 22},
  {name: "Флажок", props: present({id: "value", revision: 0, value: false, presentation: {}}), expected: 16},
])("$name", ({props, expected}) => {
  const result = height(props)
  test("Номинальная высота", () => {
    expect(result, "Возвращается собственная высота поля; минимум строки применяет Node-план").toBe(expected)
  })
})
