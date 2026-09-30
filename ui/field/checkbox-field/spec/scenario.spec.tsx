/** CheckboxField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import CheckboxField from "@ui-fields/checkbox-field"

describe.each([{name: "Основное представление", props: {checked: true, label: "Параметр"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <CheckboxField
      checked={props.checked}
      label={props.label}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Параметр")
  })
})
