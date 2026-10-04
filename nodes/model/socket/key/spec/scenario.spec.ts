/** Кодирование адреса сохраняет любые строковые идентификаторы без коллизии разделителей. */
import {describe, expect, test} from "bun:test"
import key from "@zavx0z/immersive-nodes-model-socket-key"

describe.each([
  {name: "Обычный адрес", props: {nodeId: "source", socketId: "out"}},
  {name: "Разделитель внутри ноды", props: {nodeId: "source\u0000out", socketId: "finish"}},
  {name: "Разделитель внутри сокета", props: {nodeId: "source", socketId: "out\u0000finish"}},
  {name: "Кавычки и Unicode", props: {nodeId: '\"Узел\"', socketId: "Выход"}},
])("$name", ({props}) => {
  const result = key(props.nodeId, props.socketId)
  test("Точная пара идентификаторов", () => {
    expect(JSON.parse(result), "Обе части восстанавливаются без изменения").toEqual([props.nodeId, props.socketId])
  })
  test("Разные адреса различимы", () => {
    expect(key("source\u0000out", "finish"), "Разделитель не смешивает границы идентификаторов")
      .not.toBe(key("source", "out\u0000finish"))
  })
})
