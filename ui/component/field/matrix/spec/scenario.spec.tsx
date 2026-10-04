/** MatrixField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import MatrixField from "@zavx0z/immersive-ui-component-field-matrix"

describe.each([{name: "Основное представление", props: {value: [[1, 0], [0, 1]]}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <MatrixField
      value={props.value}
     />
  )

  test("Содержимое", () => {
    expect(element.matches("input") || element.querySelector("input") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
