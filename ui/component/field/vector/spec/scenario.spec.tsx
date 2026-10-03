/** VectorField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import VectorField from "@ui-fields/vector-field"

describe.each([{name: "Основное представление", props: {value: [1, 2]}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <VectorField
      value={props.value}
     />
  )

  test("Содержимое", () => {
    expect(element.matches("input") || element.querySelector("input") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
