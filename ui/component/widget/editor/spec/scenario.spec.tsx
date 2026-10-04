/** Editor показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Editor from "@zavx0z/immersive-ui-component-widget-editor"

describe.each([{name: "Основное представление", props: {value: "let value = 1", readOnly: true, title: "Редактор"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Editor
      value={props.value}
      readOnly={props.readOnly}
      title={props.title}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Редактор")
  })
})
