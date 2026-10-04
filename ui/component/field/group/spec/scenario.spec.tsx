import Typography from "@immersive-ui-component/typography"
/** FieldGroup показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import FieldGroup from "@immersive-ui-component-field/group"

describe.each([{name: "Основное представление", props: {label: "Параметр"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <FieldGroup
      label={props.label}
    ><Typography text="Содержимое" /></FieldGroup>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
