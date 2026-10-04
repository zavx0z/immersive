/** WidgetActionButton показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import WidgetActionButton from "@zavx0z/immersive-ui-component-widget-header-action"

describe.each([{name: "Основное представление", props: {action: {id: "a", label: "Действие"}}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <WidgetActionButton
      action={props.action}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Действие")
  })
})
