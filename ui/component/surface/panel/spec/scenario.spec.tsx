import Typography from "@zavx0z/immersive-ui-component-typography"
/** Panel показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Panel from "@zavx0z/immersive-ui-component-surface-panel"

describe.each([{name: "Основное представление", props: {label: "Панель", expanded: true}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Panel
      label={props.label}
      expanded={props.expanded}
    ><Typography text="Содержимое" /></Panel>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
