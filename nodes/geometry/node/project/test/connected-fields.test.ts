import {expect, test} from "bun:test"
import project, {type ImmersiveNodesGeometryNodeProject} from "@immersive-nodes-geometry-node/project"
import socketKey from "@immersive-nodes-model-socket/key"

test("подключение матрицы не сокращает поле и не сдвигает следующие сокеты", () => {
  const snapshot: ImmersiveNodesGeometryNodeProject.Input[0] = {
    id: "node",
    parameters: [
      {id: "matrix", revision: 0, value: [[1, 0], [0, 1]], presentation: {}, valueType: {id: "matrix", version: 1}},
      {id: "number", revision: 0, value: 2, presentation: {}},
    ],
    sockets: [
      {id: "matrix-in", direction: "input", parameterId: "matrix"},
      {id: "number-in", direction: "input", parameterId: "number"},
    ],
  }
  const disconnected = project(snapshot)
  const connected = project(snapshot, undefined, new Set([socketKey("node", "matrix-in")]))
  expect(disconnected.rows[0]!.height).toBeGreaterThan(22)
  expect(connected).toEqual(disconnected)
})
