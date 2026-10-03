/** Готовые поля и пользовательская композиция разделяют адрес, сокеты и состояние подключения. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import ParameterExamples from "./fixture"

describe.each([{name: "Поля", props: {connected: false}}, {name: "Подключённые параметры", props: {connected: true}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 720, height: 1800})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ParameterExamples
      connected={props.connected}
    />
  )
  test("Общий протокол всех участников", () => {
    const parameters = [...element.querySelectorAll("[data-parameter-id]")]
    expect(parameters, "Пятнадцать полей и пользовательская композиция участвуют в одном сценарии").toHaveLength(16)
    expect(new Set(parameters.map(parameter => parameter.getAttribute("data-parameter-id"))).size, "Исходные адреса не смешиваются").toBe(16)
    expect(parameters.every(parameter => parameter.querySelector("[data-parameter-field]")?.hasAttribute("hidden") === props.connected), "Подключение скрывает поле каждого участника").toBeTrue()
    const sockets = [...element.querySelectorAll("[data-socket-id]")]
    expect(sockets, "Каждый участник сохраняет свой сокет").toHaveLength(16)
    expect(sockets.every(socket => socket.getAttribute("data-node-id") === "source" && socket.ownerDocument === element.ownerDocument), "Общий адрес ноды и Document сохраняются").toBeTrue()
  })
})
