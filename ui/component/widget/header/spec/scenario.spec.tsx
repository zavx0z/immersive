/** WidgetHeader показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import WidgetHeader from "@zavx0z/immersive-ui-component-widget-header"

describe.each([{name: "Основное представление", props: {title: "Виджет"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <WidgetHeader
      title={props.title}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Виджет")
  })
})
