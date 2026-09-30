import Typography from "@ui/typography"
import runIcon from "@ui-themes-icons/run"
/** Inspector показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Inspector from "@ui-widgets/inspector"

describe.each([{name: "Основное представление", props: {categories: [{id: "a", label: "Категория", iconSrc: runIcon}], selectedCategoryId: "a", query: ""}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Inspector
      categories={props.categories}
      selectedCategoryId={props.selectedCategoryId}
      query={props.query}
    ><Typography text="Содержимое" /></Inspector>
  )

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
