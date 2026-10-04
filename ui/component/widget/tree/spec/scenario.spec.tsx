/** Tree показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Tree from "@zavx0z/immersive-ui-component-widget-tree"

describe.each([{name: "Основное представление", props: {title: "Дерево", items: [{id: "a", label: "Первый"}], expandedKeys: [], selectedKeys: []}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Tree
      title={props.title}
      items={props.items}
      expandedKeys={props.expandedKeys}
      selectedKeys={props.selectedKeys}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Первый")
  })
})
