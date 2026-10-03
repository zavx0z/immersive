/** Ошибка сохраняет причину отказа, индекс операции и исходную cause. */
import {describe, expect, test} from "bun:test"
import PatchError, {type NodeJsonPatchError} from "@node-json-patch/error"

describe.each([
  {name: "Ошибка пути", props: {code: "path_not_found", message: "missing", index: 2, path: "/value"}},
] satisfies readonly {name: string, props: {code: NodeJsonPatchError.Input[0], message: string, index: number, path: string}}[])("$name", ({props}) => {
  const cause = new Error("source")
  const result = new PatchError(props.code, props.message, props.index, props.path, {cause})
  test("Диагностика операции", () => {
    expect(result, "Ошибка остаётся стандартным Error").toBeInstanceOf(Error)
    expect([result.code, result.operationIndex, result.path], "Адрес отказа сохраняется").toEqual([props.code, props.index, props.path])
    expect(result.cause, "Исходная ошибка не заменяется строкой").toBe(cause)
    expect(result.name, "Имя ошибки совместимо с существующими обработчиками").toBe("JsonPatchError")
  })
})
