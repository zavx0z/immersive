/** Принятая сторона раскладки имеет приоритет над исходной стороной модели. */
import {describe, expect, test} from "bun:test"
import side from "@zavx0z/immersive-nodes-geometry-node-socket-side"
import key from "@zavx0z/immersive-nodes-model-socket-key"

describe.each([
  {name: "Модель", props: {nodeId: "node", socket: {id: "out", direction: "output" as const}}, expected: "right"},
  {name: "Принятая раскладка", props: {nodeId: "node", socket: {id: "out", direction: "output" as const}, sides: new Map([[key("node", "out"), "left" as const]])}, expected: "left"},
])("$name", ({props, expected}) => {
  const result = side(props.nodeId, props.socket, "sides" in props ? props.sides : undefined)
  test("Сторона сокета", () => {
    expect(result, "Переданная раскладка сохраняется без повторного выбора стороны").toBe(expected)
  })
})
