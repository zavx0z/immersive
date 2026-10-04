/** SliderField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import SliderField from "@immersive-ui-component-field/slider"

describe.each([{name: "Основное представление", props: {value: 5, min: 0, max: 10, label: "Параметр"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <SliderField
      value={props.value}
      min={props.min}
      max={props.max}
      label={props.label}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Параметр")
  })
})
