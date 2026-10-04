/** SelectField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import SelectField from "@immersive-ui-component-field/select"

describe.each([{name: "Основное представление", props: {value: "a", options: [{key: "a", value: "a", label: "Первый"}], label: "Параметр"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <SelectField
      value={props.value}
      options={props.options}
      label={props.label}
     />
  )

  test("Содержимое", () => {
    expect(element.matches("select") || element.querySelector("select") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
