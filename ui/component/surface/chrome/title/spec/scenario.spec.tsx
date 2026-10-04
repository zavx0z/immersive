/** SurfaceTitle показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import SurfaceTitle from "@zavx0z/immersive-ui-component-surface-chrome-title"

describe.each([{name: "Основное представление", props: {text: "Название"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <SurfaceTitle
      text={props.text}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Название")
  })
})
