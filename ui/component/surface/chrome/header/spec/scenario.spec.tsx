import Typography from "@zavx0z/immersive-ui-component-typography"
/** SurfaceHeader показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import SurfaceHeader from "@zavx0z/immersive-ui-component-surface-chrome-header"

describe.each([{name: "Основное представление", props: {}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <SurfaceHeader

    ><Typography text="Содержимое" /></SurfaceHeader>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
