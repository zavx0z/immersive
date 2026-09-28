import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {ContentNode} from "@nodes/node/content"
import {planProjectedNodeGeometry} from "@nodes/node/geometry"
import {Typography} from "@zavx0z/ui/typography"
import {parameters, sockets} from "../../spec/fixture/parameters"

describe.each([
  {name: "Содержимое и параметры", props: {id: "open", label: "Нода с содержимым", parameters, sockets, collapsed: false, contentVisible: true}},
  {name: "Только содержимое", props: {id: "content", label: "Свёрнутые параметры", parameters, sockets, collapsed: true, contentVisible: true}},
  {name: "Только параметры", props: {id: "parameters", label: "Скрытое содержимое", parameters, sockets, collapsed: false, contentVisible: false}},
  {name: "Компактная нода", props: {id: "compact", label: "Компактная нода", parameters, sockets, collapsed: true, contentVisible: false}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 560})
  afterAll(() => headless.dispose())
  const node = await headless.render(
    <ContentNode
      id={props.id}
      label={props.label}
      rect={{
        x: 16,
        y: 16,
        width: 320,
        height: planProjectedNodeGeometry(
          {id: props.id, parameters: props.parameters, sockets: props.sockets},
          320,
          undefined,
          undefined,
          {kind: "content", collapsed: props.collapsed, contentVisible: props.contentVisible},
        ).height,
      }}
      parameters={props.parameters}
      sockets={props.sockets}
      collapsed={props.collapsed}
      contentVisible={props.contentVisible}
    >
      <Typography text="Произвольное содержимое" />
    </ContentNode>,
  )

  test("Одна нода", () => {
    expect({id: node.getAttribute("data-node-id"), nested: node.querySelectorAll("article[data-node-id]").length},
      "Содержимое и параметры образуют одну ноду графа").toEqual({id: props.id, nested: 0})
  })
  test("Независимые области", () => {
    expect({content: node.getAttribute("data-content-visible"), parameters: node.getAttribute("data-parameters-collapsed")},
      "Область компонента и поля параметров раскрываются независимо").toEqual({content: String(props.contentVisible), parameters: String(props.collapsed)})
  })
  test("Связи", () => {
    expect(node.querySelectorAll("[data-socket-id]").length, "Оба сокета сохраняются при любом сочетании раскрытия").toBe(2)
  })

})
