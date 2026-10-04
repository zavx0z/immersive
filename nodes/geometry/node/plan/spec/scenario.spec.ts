/** План строк сохраняет порядок, центры сокетов и неизменяемость результата. */
import {describe, expect, test} from "bun:test"
import plan, {type ImmersiveNodesGeometryNodePlan} from "@immersive-nodes-geometry-node/plan"

describe.each([
  {name: "Строки", props: {width: 180, rows: [{height: 22, socketIds: ["first"]}, {height: 30, spacingBefore: 5, socketIds: ["second"]}]}},
  {name: "Свёрнутое представление", props: {width: 180, rows: [{height: 22, socketIds: ["first"]}, {height: 30, socketIds: ["second"]}], collapsed: true}},
] satisfies readonly {name: string, props: ImmersiveNodesGeometryNodePlan.Input}[])("$name", ({props}) => {
  const before = JSON.stringify(props)
  const result = plan(props)
  test("Геометрия строки и сокетов", () => {
    expect(result.sockets.map(socket => socket.id), "Порядок сокетов сохраняет порядок входных строк").toEqual(["first", "second"])
    expect(result.sockets.every(socket => socket.y > 0 && socket.y < result.height), "Сокеты остаются внутри рассчитанной высоты").toBeTrue()
    expect(result.rows, "Сворачивание исключает строки из представления").toHaveLength("collapsed" in props ? 0 : 2)
    expect(Object.isFrozen(result), "План доступен без внешней записи").toBeTrue()
    expect(JSON.stringify(props), "Входные строки не изменяются").toBe(before)
  })
})
