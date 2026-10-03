/** isInspectorPanelVisible показывает публичное использование своего владельца. */
import {describe, expect, test} from "bun:test"
import operation from "@ui-widgets-inspector/is-inspector-panel-visible"

describe.each([{name: "Публичный вызов", props: {args: [[], "", "", {id: "a", label: "Панель"}] as const}}])("$name", ({props}) => {
  const result = operation(...props.args)
  test("Результат", () => {
    expect(result, "Без выбранной категории панель недоступна").toBe(false)
  })
})
