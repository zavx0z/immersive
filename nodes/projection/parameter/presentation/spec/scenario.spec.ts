/** Один снимок задаёт вид поля и его данные без обращения к Store или Document. */
import {describe, expect, test} from "bun:test"
import present, {type ImmersiveNodesProjectionParameterPresentation} from "@zavx0z/immersive-nodes-projection-parameter-presentation"

describe.each([
  {name: "Переключатель", props: {id: "flag", revision: 0, value: false, presentation: {interaction: "switch"}}, kind: "switch", step: .1},
  {name: "Целое число", props: {id: "integer", revision: 0, value: 3, presentation: {}, valueType: {id: "integer", version: 1}}, kind: "number", step: 1},
  {name: "Ограниченный слайдер", props: {id: "fraction", revision: 0, value: .4, presentation: {interaction: "slider", min: 0, max: 1}}, kind: "slider", step: .1},
  {name: "Слайдер без границ", props: {id: "number", revision: 0, value: .4, presentation: {interaction: "slider"}}, kind: "number", step: .1},
  {name: "Вращение", props: {id: "rotation", revision: 0, value: [1, 2, 3], presentation: {}, valueType: {id: "rotation", version: 1}}, kind: "vector", step: .1},
  {name: "Произвольный JSON", props: {id: "result", revision: 0, value: {status: "ok"}, presentation: {}}, kind: "output", step: .1},
] satisfies readonly {name: string, props: ImmersiveNodesProjectionParameterPresentation.Input, kind: ImmersiveNodesProjectionParameterPresentation.Output["kind"], step: number}[])("$name", ({props, kind, step}) => {
  const before = JSON.stringify(props)
  const result = present(props)
  test("Представление снимка", () => {
    expect(result.kind, "Тип значения и presentation совместно определяют поле").toBe(kind)
    expect(result.label, "Отсутствующая подпись сохраняет исходный id параметра").toBe(props.id)
    expect(result.step, "Целое число и дробное значение сохраняют разные шаги").toBe(step)
    expect(Object.isFrozen(result), "Результат доступен нескольким потребителям без записи извне").toBeTrue()
    expect(JSON.stringify(props), "Подготовка представления не меняет исходный снимок").toBe(before)
  })
})
