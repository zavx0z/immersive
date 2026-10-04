/** CodeEditor показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import CodeEditor from "@zavx0z/immersive-ui-component-view-code-editor"

describe.each([{name: "Основное представление", props: {value: "let value = 1", readOnly: true}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <CodeEditor
      value={props.value}
      readOnly={props.readOnly}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("let value = 1")
  })
})
