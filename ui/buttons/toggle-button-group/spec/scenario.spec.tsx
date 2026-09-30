/** ToggleButtonGroup показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import ToggleButtonGroup from "@ui-buttons/toggle-button-group"

describe.each([{name: "Основное представление", props: {value: "a", options: [{key: "a", value: "a", label: "Первый"}]}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ToggleButtonGroup
      value={props.value}
      options={props.options}
     />
  )

  test("Содержимое", () => {
    expect(element.matches("button") || element.querySelector("button") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
