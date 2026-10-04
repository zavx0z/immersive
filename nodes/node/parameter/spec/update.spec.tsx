import {expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import ParameterNode from "@zavx0z/immersive-nodes-node-parameter"
import {parameters, sockets} from "../../spec/fixture/parameters"

test.each([{collapsed: false}, {collapsed: true}])("обновление collapsed=$collapsed сохраняет элементы ноды", async ({collapsed}) => {
  const headless = createHeadless({width: 400, height: 560})
  const props = {id: "update", label: "Обновление ноды", parameters, sockets, collapsed}
  try {
    const node = await headless.render(
      <ParameterNode
        id={props.id}
        label={props.label}
        parameters={props.parameters}
        sockets={props.sockets}
        collapsed={props.collapsed}
      />,
    )
    const field = node.querySelector("input")
    const socket = node.querySelector("[data-socket-id]")
    const updated = await headless.render(
      <ParameterNode
        id={props.id}
        label={props.label}
        parameters={props.parameters}
        sockets={props.sockets}
        collapsed={!props.collapsed}
      />,
    )
    expect({sameNode: updated === node, sameField: updated.querySelector("input") === field,
      sameSocket: updated.querySelector("[data-socket-id]") === socket, collapsed: updated.hasAttribute("data-collapsed")},
    "Обновление одного prop сохраняет ноду, поле и сокет").toEqual({sameNode: true, sameField: true, sameSocket: true, collapsed: !props.collapsed})
  } finally {
    await headless.dispose()
  }
}, 30_000)
