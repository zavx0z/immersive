/** Все виды сокетов используют один адресуемый семантический элемент. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import Socket from "@zavx0z/immersive-nodes-socket"
import kinds from "@zavx0z/immersive-nodes-model-socket-kinds"

describe.each(kinds.map(kind => ({name: kind, props: {kind, id: "value", nodeId: "source", label: "Значение"}})))("$name", async ({props}) => {
  const headless = createHeadless({width: 240, height: 80})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <Socket
      id={props.id}
      nodeId={props.nodeId}
      kind={props.kind}
      label={props.label}
      direction="output"
      side="right"
      presentation="row"
    />
  )
  test("Адрес и представление", () => {
    const socket = element
    expect(socket.tagName, "Корневой элемент является семантической кнопкой").toBe("BUTTON")
    expect(socket.getAttribute("data-node-id"), "Сокет сохраняет владельца адреса").toBe(props.nodeId)
    expect(socket.getAttribute("data-socket-id"), "Сокет сохраняет собственный адрес").toBe(props.id)
    expect(socket.getAttribute("data-socket-kind"), "Вид выбирает предустановку").toBe(props.kind)
    expect(socket.textContent, "Строка показывает авторскую подпись").toContain(props.label)
    expect(socket.ownerDocument?.querySelector('[data-socket-id="value"]'), "Сокет смонтирован в принимающий Document").toBe(socket)
    expect(element.querySelectorAll("canvas"), "Сокет не создаёт собственного Canvas").toHaveLength(0)
  })
})
