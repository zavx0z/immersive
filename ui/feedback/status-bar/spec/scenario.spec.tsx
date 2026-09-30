import Typography from "@ui/typography"
/** StatusBar показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import StatusBar from "@ui-feedback/status-bar"

describe.each([{name: "Основное представление", props: {}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <StatusBar
    ><Typography text="Содержимое" /></StatusBar>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
