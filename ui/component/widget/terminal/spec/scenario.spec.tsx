/** Terminal показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Terminal from "@zavx0z/immersive-ui-component-widget-terminal"

describe.each([{name: "Основное представление", props: {input: "", title: "Терминал"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Terminal
      input={props.input}
      title={props.title}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Терминал")
  })
})
