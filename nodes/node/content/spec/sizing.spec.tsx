import {expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import ContentNode from "@zavx0z/immersive-nodes-node-content"

test("CSS ширина ContentNode определяет квадрат без внешнего плана", async () => {
  const headless = createHeadless({width: 400, height: 560})
  try {
    const node = await headless.render(
      <ContentNode
        id="css-content"
        label="Содержимое"
      />,
    )
    for (const width of [180, 260]) {
      node.setAttribute("style", `${node.getAttribute("style") ?? ""};width:${`${width}px`}`)
      const content = node.querySelector("[data-node-content]")!.getBoundingClientRect()
      const parameters = node.querySelector('[data-node-kind="parameter"]')!.getBoundingClientRect()
      expect({width: content.width, height: content.height, parameters: parameters.width})
        .toEqual({width, height: width, parameters: width})
      expect(node.getBoundingClientRect().height).toBeCloseTo(content.height + parameters.height)
    }
  } finally { await headless.dispose() }
}, 30_000)
