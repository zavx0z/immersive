/** ColorPickerField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import ColorPickerField from "@immersive-ui-component-field/color-picker"

describe.each([{name: "Основное представление", props: {value: {r: 1, g: 0, b: 0, a: 1}}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ColorPickerField
      value={props.value}
     />
  )

  test("Содержимое", () => {
    expect(element.matches("input") || element.querySelector("input") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
