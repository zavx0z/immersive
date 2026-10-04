/** Breadcrumbs показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Breadcrumbs from "@immersive-ui-component-navigation/breadcrumb"

describe.each([{name: "Основное представление", props: {items: [{id: "a", label: "Начало"}, {id: "b", label: "Раздел"}]}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Breadcrumbs
      items={props.items}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Начало")
  })
})
