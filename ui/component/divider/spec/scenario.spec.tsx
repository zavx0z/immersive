/** Divider показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Divider from "@zavx0z/immersive-ui-component-divider"

describe.each([{name: "Основное представление", props: {}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Divider

     />
  )

  test("Содержимое", () => {
    expect(element.matches("hr") || element.querySelector("hr") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
