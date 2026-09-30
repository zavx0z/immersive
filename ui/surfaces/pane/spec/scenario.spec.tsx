import Typography from "@ui/typography"
/** Pane показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Pane from "@ui-surfaces/pane"

describe.each([{name: "Основное представление", props: {}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Pane

    ><Typography text="Содержимое" /></Pane>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
