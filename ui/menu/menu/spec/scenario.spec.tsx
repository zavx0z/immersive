/** Menu показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Menu from "@ui-menus/menu"

describe.each([{name: "Основное представление", props: {open: true, x: 0, y: 0, items: [{key: "a", label: "Действие", onSelect() {}}], onClose() {}}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Menu
      open={props.open}
      x={props.x}
      y={props.y}
      items={props.items}
      onClose={props.onClose}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Действие")
  })
})
