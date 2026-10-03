/** Готовый параметр сохраняет общий адрес и сокеты при подключении. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import Component, {type NodesParametersCollection} from "@nodes-parameters/collection"

describe.each([false, true].map(connected => ({
  name: connected ? "Подключённый параметр" : "Редактируемый параметр",
  props: {
    id: "value",
    nodeId: "source",
    label: "Значение",
    connected,
    sockets: [{id: "in", kind: "float", direction: "input", side: "left", label: "Вход"}],
    items: [{id: "first", label: "Первый"}], selectedId: "first",
  } satisfies NodesParametersCollection.Input,
})))("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 500})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Component
      {...props}
    />
  )
  test("Общая строка параметра", () => {
    expect(element.getAttribute("data-parameter-id"), "Адрес параметра сохраняется").toBe(props.id)
    expect(element.textContent, "Подпись остаётся частью представления").toContain(props.label)
    expect(element.querySelector("[data-parameter-field]")?.hasAttribute("hidden"), "Подключение скрывает поле, сохраняя строку").toBe(props.connected)
    const socket = element.querySelector('[data-socket-id="in"]')!
    expect(socket.getAttribute("data-node-id"), "Сокет сохраняет адрес ноды").toBe(props.nodeId)
    expect(socket.ownerDocument, "Параметр и сокет используют один Document").toBe(element.ownerDocument)
  })
})
