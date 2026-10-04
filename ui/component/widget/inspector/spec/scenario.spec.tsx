import Typography from "@zavx0z/immersive-ui-component-typography"
import runIcon from "@zavx0z/immersive-ui-theme-icon-run"
/** Inspector показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Inspector from "@zavx0z/immersive-ui-component-widget-inspector"

describe.each([
  {name: "Основное представление", props: {categories: [{id: "a", label: "Категория", iconSrc: runIcon}], selectedCategoryId: "a", query: "", showSearch: undefined}},
  {name: "Без поиска", props: {categories: [{id: "a", label: "Категория", iconSrc: runIcon}], selectedCategoryId: "a", query: "", showSearch: false}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Inspector
      categories={props.categories}
      selectedCategoryId={props.selectedCategoryId}
      query={props.query}
      showSearch={props.showSearch}
    >
      <Typography text="Содержимое" />
    </Inspector>
  )

  test("Поиск", () => {
    expect(element.querySelector('input[type="search"]')!.closest("[hidden]") === null, "Поиск виден только когда разрешён входом").toBe(props.showSearch !== false)
    expect(element.querySelector("header")!.hasAttribute("hidden"), "При отключённом поиске без действий скрыта и шапка").toBe(props.showSearch === false)
  })

  test("Содержимое", () => {
    expect(element.textContent, "Безымянный слот сохраняет переданное содержимое").toContain("Содержимое")
  })
})
