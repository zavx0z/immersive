/** CollectionField показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import CollectionField from "@immersive-ui-component-field/collection"

describe.each([{name: "Основное представление", props: {items: [{id: "a", label: "Первый"}], selectedId: "a"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <CollectionField
      items={props.items}
      selectedId={props.selectedId}
     />
  )

  test("Содержимое", () => {
    expect(element.matches("[role=\"option\"]") || element.querySelector("[role=\"option\"]") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
