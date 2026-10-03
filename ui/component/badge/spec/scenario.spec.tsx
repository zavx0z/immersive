/** Badge показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Badge from "@ui/badge"

describe.each([{name: "Основное представление", props: {label: "Готово"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Badge
      label={props.label}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Готово")
  })
})
