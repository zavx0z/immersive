/** Порт Layout различает границы любых идентификаторов и отвергает пустой адрес. */
import {describe, expect, test} from "bun:test"
import portId from "@zavx0z/immersive-nodes-geometry-node-port-id"

describe.each([
  {name: "Обычный адрес", props: {nodeId: "node", socketId: "out"}},
  {name: "Слеш в ноде", props: {nodeId: "node/part", socketId: "out"}},
  {name: "Слеш в сокете", props: {nodeId: "node", socketId: "part/out"}},
])("$name", ({props}) => {
  const result = portId(props.nodeId, props.socketId)
  test("Однозначный адрес порта", () => {
    expect(JSON.parse(result), "Идентификаторы сохраняются без потерь").toEqual([props.nodeId, props.socketId])
    expect(portId("node/part", "out"), "Разделитель внутри идентификатора не смешивает адреса").not.toBe(portId("node", "part/out"))
    expect(() => portId("", props.socketId), "Пустой Node ID отклоняется").toThrow("non-empty")
  })
})
