/** CycleField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import CycleField from "@zavx0z/immersive-ui-component-field-cycle"

describe.each([{name: "Основное представление", props: {value: "a", options: [{key: "a", value: "a", label: "Первый"}], label: "Параметр"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <CycleField
      value={props.value}
      options={props.options}
      label={props.label}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Параметр")
  })
})
