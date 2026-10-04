/** Представление снимка сохраняет точные адреса портов и размеры строк. */
import {describe, expect, test} from "bun:test"
import project, {type ImmersiveNodesGeometryNodeProject} from "@immersive-nodes-geometry-node/project"
import portId from "@immersive-nodes-geometry-node/port-id"

describe.each([
  {name: "Обычные идентификаторы", props: {id: "source", parameters: [], sockets: [{id: "out", direction: "output"}]}},
  {name: "Разделители в идентификаторах", props: {id: "source/part", parameters: [], sockets: [{id: "out/port", direction: "output"}]}},
] satisfies readonly {name: string, props: ImmersiveNodesGeometryNodeProject.Input[0]}[])("$name", ({props}) => {
  const result = project(props)
  test("Адрес и размеры", () => {
    expect(result.sockets.map(socket => socket.id), "Каждый порт адресует точную исходную пару").toEqual([portId(props.id, props.sockets[0]!.id)])
    expect(result.width, "Нода имеет минимальную допустимую ширину").toBeGreaterThanOrEqual(100)
    expect(result.sockets[0]!.y, "Сокет располагается внутри ноды").toBeLessThan(result.height)
  })
})
