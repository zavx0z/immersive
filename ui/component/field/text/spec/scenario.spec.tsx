/** TextField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import TextField from "@zavx0z/immersive-ui-component-field-text"

describe.each([{name: "Основное представление", props: {value: "Текст", label: "Параметр"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <TextField
      value={props.value}
      label={props.label}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Параметр")
  })
})
