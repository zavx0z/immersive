import {describe, expect, test} from "bun:test"
import slotChild, {type SlotChildInput} from "@jsx-slot/child"

describe.each([
  {name: "Пустая default позиция", props: ["", null, "conditional"]},
  {name: "Пустая именованная позиция", props: ["header", undefined, "conditional"]},
  {name: "Пустой именованный keyed список", props: ["header", [], "keyed"]},
])("$name", ({props}: {props: SlotChildInput}) => {
  const actual = slotChild(...props)

  test("Статическое назначение", () => {
    expect(actual, "Descriptor сохраняет имя области и вид синтаксической позиции даже при пустом content").toEqual({"@zavx0z/jsx/slot-child": true, name: props[0], content: props[1], kind: props[2]})
  })
  test("Результат expression", () => {
    expect(actual.content, "Фабрика передаёт исходный результат для последующей проверки runtime").toBe(props[1])
  })
  test("Неизменяемый descriptor", () => {
    expect(Object.isFrozen(actual), "Назначение позиции не меняется между подготовкой и распределением детей").toBeTrue()
  })
})
