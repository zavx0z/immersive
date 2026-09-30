/** Timeline показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Timeline from "@ui-views/timeline"

describe.each([{name: "Основное представление", props: {title: "Время"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Timeline
      title={props.title}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Время")
  })
})
