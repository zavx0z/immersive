/** Проекция использует настоящий внешний Store и сохраняет Element при обновлении значения. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import type {HTMLInputElement} from "@immersive/dom"
import ParameterProjection from "@immersive-nodes-projection/parameter"
import ParameterStore from "@immersive-nodes-model-parameter/store"
import {createNodeTree, createNodeTreeExternalStore} from "@immersive-nodes/tree"

describe.each([
  {name: "Числовое значение", props: {value: 2, next: 3}},
  {name: "Отрицательное значение", props: {value: -2, next: -1}},
])("$name", async ({props}) => {
  const parameter = new ParameterStore<number, {label: string}>("value", props.value, {label: "Число"}, {id: "float", version: 1})
  const tree = createNodeTree({nodes: [{id: "source", parameters: [parameter]}]})
  const store = createNodeTreeExternalStore(tree).parameter("source", "value")
  const headless = createHeadless({width: 400, height: 180})
  afterAll(async () => {
    await headless.dispose()
    tree.dispose()
  })
  const element = await headless.render(
    <ParameterProjection
      nodeId="source"
      snapshot={parameter.snapshot()}
      sockets={[]}
      store={store}
    />
  )
  test("Один Store и устойчивая строка", async () => {
    const input = element.querySelector("input") as HTMLInputElement
    expect(input.value, "Первое значение происходит из Store").toBe(String(props.value))
    parameter.set(props.next)
    await Promise.resolve()
    expect(element.querySelector("input"), "Обновление Store не заменяет поле").toBe(input)
    expect(input.value, "Изменение отображается из того же Store").toBe(String(props.next))
    expect(tree.parameter("source", "value"), "Проекция не создаёт второй Store").toBe(parameter)
  })
})
