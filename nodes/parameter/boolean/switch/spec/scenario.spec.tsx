/** Готовый параметр сохраняет общий адрес и сокеты при подключении. */
import {afterAll, describe, expect, test} from "bun:test"
import Socket from "@zavx0z/immersive-nodes-socket"
import {createHeadless} from "@zavx0z/immersive-headless"
import Component, {type ImmersiveNodesParameterBooleanSwitch} from "@zavx0z/immersive-nodes-parameter-boolean-switch"

describe.each([false, true].map(connected => ({
  name: connected ? "Поле с подключённым сокетом" : "Поле без подключения",
  props: {
    id: "value",
    nodeId: "source",
    label: "Значение",
    connected,
    checked: false,
  } satisfies ImmersiveNodesParameterBooleanSwitch.Input,
  slots: {
    left: <Socket
      slot="left"
      id="in"
      nodeId="source"
      kind="float"
      direction="input"
      side="left"
      label="Вход"
      connected={connected}
    />,
  },
})))("$name", async ({props, slots}) => {
  const headless = createHeadless({width: 400, height: 500})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Component
      id={props.id}
      nodeId={props.nodeId}
      label={props.label}
      connected={props.connected}
      checked={props.checked}
    >
      {slots.left}
    </Component>
  )
  test("Общая строка параметра", () => {
    expect(element.getAttribute("data-parameter-id"), "Адрес параметра сохраняется").toBe(props.id)
    expect(element.textContent, "Подпись остаётся частью представления").toContain(props.label)
    expect(element.querySelector("[data-parameter-field]")?.hasAttribute("hidden"), "Ручное поле остаётся видимым при подключённом сокете").toBe(false)
    const socket = element.querySelector('[data-socket-id="in"]')!
    expect(socket.getAttribute("data-node-id"), "Сокет сохраняет адрес ноды").toBe(props.nodeId)
    expect(socket.getAttribute("aria-pressed"), "Состояние подключения относится к сокету, не скрывая поле").toBe(String(props.connected))
    expect(socket.ownerDocument, "Параметр и сокет используют один Document").toBe(element.ownerDocument)
  })
})
