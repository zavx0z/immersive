/** Tree показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Tree from "@ui-widgets/tree"

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
