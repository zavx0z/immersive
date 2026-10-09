/** Публичный редактор применяет один протокол меток к отладке и диагностике. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import {MouseEvent} from "@zavx0z/immersive-dom"
import CodeEditor from "@zavx0z/immersive-ui-component-view-code-editor"

const marker = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Ccircle cx='7' cy='7' r='5' fill='%23e35d6a'/%3E%3C/svg%3E"

describe.each([
  {name: "Исходный текст", props: {value: "let value = 1", readOnly: true, lineMarkers: [], lineDecorations: []}},
  {name: "Точка останова", props: {value: "let value = 1\nvalue += 2", readOnly: false,
    lineMarkers: [{line: 1, iconSrc: marker, label: "Точка останова"}], lineDecorations: [{line: 1, numberTone: "warning" as const}]}},
  {name: "Диагностика", props: {value: "let value = 1\nvalue += missing", readOnly: true,
    lineMarkers: [{line: 1, iconSrc: marker, label: "Неизвестное имя"}], lineDecorations: [{line: 1, numberTone: "error" as const}]}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const actions: string[] = []
  const element = await headless.render(
    <CodeEditor
      value={props.value}
      readOnly={props.readOnly}
      lineMarkers={props.lineMarkers}
      lineDecorations={props.lineDecorations}
      showLineMarkers={true}
      onLineMarkerClick={line => actions.push(`marker:${line}`)}
      onLineNumberClick={line => actions.push(`number:${line}`)}
    />,
  )

  test("Содержимое", () => {
    expect(element.querySelector("code")!.textContent, "Оформление номера не изменяет авторский текст").toBe(props.value)
  })

  test("Независимые действия", () => {
    const line = props.lineMarkers[0]?.line ?? 0
    element.querySelector(`[data-line-marker="${line}"]`)!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    element.querySelector(`[data-line-number="${line}"]`)!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    expect(actions, "Пустое или заполненное поле и номер выбирают разные действия владельца данных").toEqual([`marker:${line}`, `number:${line}`])
  })
})
