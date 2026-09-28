import {expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {ContentNode} from "@nodes/node/content"
import {Typography} from "@zavx0z/ui/typography"
import {parameters, sockets} from "../../spec/fixture/parameters"

test.each([
  {collapsed: false, contentVisible: true},
  {collapsed: true, contentVisible: true},
  {collapsed: false, contentVisible: false},
  {collapsed: true, contentVisible: false},
])("обновление видимости $contentVisible при collapsed=$collapsed сохраняет содержимое", async ({collapsed, contentVisible}) => {
  const headless = createHeadless({width: 400, height: 560})
  const props = {id: "update", label: "Обновление содержимого", parameters, sockets, collapsed, contentVisible}
  try {
    const node = await headless.render(
      <ContentNode
        id={props.id}
        label={props.label}
        parameters={props.parameters}
        sockets={props.sockets}
        collapsed={props.collapsed}
        contentVisible={props.contentVisible}
      >
        <Typography text="Произвольное содержимое" />
      </ContentNode>,
    )
    const area = node.querySelector("[data-node-content]")!
    const updated = await headless.render(
      <ContentNode
        id={props.id}
        label={props.label}
        parameters={props.parameters}
        sockets={props.sockets}
        collapsed={props.collapsed}
        contentVisible={!props.contentVisible}
      >
        <Typography text="Произвольное содержимое" />
      </ContentNode>,
    )
    expect({sameNode: updated === node, sameArea: updated.querySelector("[data-node-content]") === area,
      visible: updated.getAttribute("data-content-visible"), collapsed: updated.getAttribute("data-parameters-collapsed")},
    "Изменение видимости сохраняет содержимое и состояние параметров").toEqual({
      sameNode: true, sameArea: true, visible: String(!props.contentVisible), collapsed: String(props.collapsed),
    })
  } finally {
    await headless.dispose()
  }
}, 30_000)
