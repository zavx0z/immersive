/** SurfaceButton показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import SurfaceButton from "@immersive-ui-component-surface-chrome/button"

describe.each([{name: "Основное представление", props: {label: "Действие"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <SurfaceButton
      label={props.label}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Действие")
  })
})
