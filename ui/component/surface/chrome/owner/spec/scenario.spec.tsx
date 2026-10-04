import Typography from "@zavx0z/immersive-ui-component-typography"
/** SurfaceOwner показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import SurfaceOwner from "@zavx0z/immersive-ui-component-surface-chrome-owner"

describe.each([{name: "Основное представление", props: {label: "Поверхность"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <SurfaceOwner
      label={props.label}
    ><Typography text="Содержимое" /></SurfaceOwner>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
