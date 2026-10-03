import Typography from "@ui/typography"
/** SurfaceNavigation показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import SurfaceNavigation from "@ui-surfaces-chrome/navigation"

describe.each([{name: "Основное представление", props: {label: "Действия"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <SurfaceNavigation
      label={props.label}
    ><Typography text="Содержимое" /></SurfaceNavigation>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
