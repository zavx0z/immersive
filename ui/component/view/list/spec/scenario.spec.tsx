/** List показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import List from "@zavx0z/immersive-ui-component-view-list"

describe.each([{name: "Основное представление", props: {items: [{key: "a", label: "Первый"}]}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <List
      items={props.items}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Первый")
  })
})
