/** Изменения публикуются только целиком; отказ сохраняет исходный документ. */
import {describe, expect, test} from "bun:test"
import patch, {type NodesJsonPatch} from "@nodes/json-patch"
import JsonPatchError from "@node-json-patch/error"

describe.each([
  {name: "Замена значения", props: {source: {value: 1}, operations: [{op: "replace", path: "/value", value: 2}]}},
  {name: "Проверка и замена", props: {source: {value: 1}, operations: [{op: "test", path: "/value", value: 1}, {op: "replace", path: "/value", value: 2}]}},
] satisfies readonly {name: string, props: {source: NodesJsonPatch.Input[0], operations: NodesJsonPatch.Input[1]}}[])("$name", ({props}) => {
  const result = patch(props.source, props.operations)
  test("Атомарный результат", () => {
    expect(result, "Операции дают полный новый документ").toEqual({value: 2})
    expect(props.source, "Исходный документ не изменяется").toEqual({value: 1})
    expect(Object.isFrozen(result), "Результат нельзя менять извне").toBeTrue()
  })
  test("Отказ после первой операции", () => {
    expect(() => patch(props.source, [
      {op: "replace", path: "/value", value: 3},
      {op: "test", path: "/value", value: 99},
    ]), "Ошибка проверки не публикует частично изменённый документ").toThrow(JsonPatchError)
    expect(props.source, "Отказ также сохраняет источник").toEqual({value: 1})
  })
})
