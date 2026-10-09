/** Editor показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {MouseEvent} from "@zavx0z/immersive-dom"
import {createHeadless} from "@zavx0z/immersive-headless"
import Editor from "@zavx0z/immersive-ui-component-widget-editor"

describe.each([{name: "Основное представление", props: {value: "let value = 1", readOnly: true, title: "Редактор"}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const actions: string[] = []
  const element = await headless.render(
    <Editor
      value={props.value}
      readOnly={props.readOnly}
      title={props.title}
      lineMarkers={[{line: 0, iconSrc: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Ccircle cx='7' cy='7' r='5' fill='%23e35d6a'/%3E%3C/svg%3E", label: "Метка"}]}
      lineDecorations={[{line: 0, numberTone: "info"}]}
      onLineMarkerClick={line => actions.push(`marker:${line}`)}
      onLineNumberClick={line => actions.push(`number:${line}`)}
     />
  )

  test("Независимые поля редактора", () => {
    element.querySelector('[data-line-marker="0"]')!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    element.querySelector('[data-line-number="0"]')!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    expect(actions, "Widget передаёт два независимых действия публичному CodeEditor").toEqual(["marker:0", "number:0"])
    expect(element.querySelector('[data-line-number="0"]')!.getAttribute("data-number-tone"), "Widget сохраняет оформление номера").toBe("info")
  })

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Редактор")
  })
})
