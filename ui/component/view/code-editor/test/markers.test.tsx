/** Независимые метки и номер строки применимы к отладчику и диагностике. */
import {describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import {MouseEvent} from "@zavx0z/immersive-dom"
import CodeEditor, {type ImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"

const icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Ccircle cx='7' cy='7' r='5' fill='red'/%3E%3C/svg%3E"

describe.each([
  {name: "Точка останова", props: {label: "Снять точку", tone: "warning" as const}},
  {name: "Диагностика", props: {label: "Показать ошибку", tone: "error" as const}},
  {name: "Примечание", props: {label: "Открыть примечание", tone: "neutral" as const}},
])("$name", ({props}) => {
  test("метка и номер вызывают разные действия без изменения текста", async () => {
    const headless = createHeadless({width: 640, height: 400})
    const clicked: string[] = []
    let markers = [{line: 1, iconSrc: icon, label: String(props.label), disabled: false}]
    let enabled = true
    let tone: typeof props.tone | undefined = props.tone
    let handle: Parameters<NonNullable<ImmersiveUiComponentViewCodeEditor.Input["onReady"]>>[0] = null
    const render = () => headless.render(
      <CodeEditor
        value={"let value = 1\nvalue += 2\n"}
        readOnly={false}
        showLineMarkers={true}
        lineMarkers={markers}
        lineDecorations={[{line: 1, numberTone: tone}]}
        onLineMarkerClick={enabled ? line => clicked.push(`marker:${line}`) : undefined}
        onLineNumberClick={line => clicked.push(`number:${line}`)}
        onReady={value => { handle = value }}
      />,
    )
    try {
      const element = await render()
      await headless.capture(element)
      const code = element.querySelector("code")!
      const before = code.textContent
      const selection = handle!.getSelection()
      element.querySelector('[data-line-marker="1"]')!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      element.querySelector('[data-line-number="1"]')!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      element.querySelector('[data-line-marker="0"]')!.dispatchEvent(new MouseEvent("click", {bubbles: true}))
      expect(clicked, "Заполненное поле, номер и пустое поле независимы").toEqual(["marker:1", "number:1", "marker:0"])
      expect(code.textContent, "Клики по полям не изменяют исходник").toBe(before)
      expect(handle!.getSelection(), "Клики не перемещают текстовый курсор").toEqual(selection)
      expect(element.querySelector('[data-line-number="1"]')!.getAttribute("data-number-tone"), "Рамка относится к номеру, а не к строке").toBe(props.tone)
      expect(element.querySelector("[data-code-gutter]")!.getBoundingClientRect().width, "Метка и номер помещаются в компактное поле").toBeLessThanOrEqual(48)
      markers[0]!.label = `${props.label} обновлена`
      const renamed = await render()
      expect(renamed.querySelector('[data-line-marker="1"]')!.getAttribute("aria-label"), "Повторный render замечает изменение того же объекта данных").toBe(`${props.label} обновлена`)
      markers = [{...markers[0]!, disabled: true}]
      tone = undefined
      const changed = await render()
      expect(changed.querySelector("code"), "Повторное представление сохраняет узел редактируемого кода").toBe(code)
      expect(changed.querySelector('[data-line-marker="1"]')!.hasAttribute("disabled"), "Отключённая метка остаётся видимой, но недоступна").toBeTrue()
      expect(changed.querySelector('[data-line-marker="1"] img'), "Значок не исчезает при смене доступности").not.toBeNull()
      expect(changed.querySelector('[data-line-number="1"]')!.hasAttribute("data-number-tone"), "Снятая рамка не сохраняется из прежнего состояния").toBeFalse()
      markers = []
      enabled = false
      const cleared = await render()
      expect(cleared.querySelector('[data-line-marker="1"] img')!.hasAttribute("hidden"), "Удаление данных скрывает прежний значок").toBeTrue()
      expect(cleared.querySelector('[data-line-marker="1"]'), "Пустое поле сохраняет геометрию при отключении действий").not.toBeNull()
    } finally {
      headless.dispose()
    }
  })
})
