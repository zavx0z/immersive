import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {MouseEvent} from "@zavx0z/dom"
import {parameters, sockets} from "../../spec/fixture/parameters"
import {ContentFixture} from "./fixture"

describe.each([
  {name: "Содержимое и параметры", props: {id: "open", label: "Интерактивная нода", parameters, sockets, collapsed: false, contentVisible: true}},
  {name: "Только содержимое", props: {id: "content", label: "Свёрнутые параметры", parameters, sockets, collapsed: true, contentVisible: true}},
  {name: "Только параметры", props: {id: "parameters", label: "Скрытое содержимое", parameters, sockets, collapsed: false, contentVisible: false}},
  {name: "Компактная нода", props: {id: "compact", label: "Компактная нода", parameters, sockets, collapsed: true, contentVisible: false}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 560})
  afterAll(() => headless.dispose())
  const result = await headless.render(ContentFixture, props)

  const node = result.querySelector("article")!

  test("Одна нода", () => {
    expect(result.querySelectorAll("article[data-node-id]").length, "Содержимое и параметры образуют одну ноду графа").toBe(1)
  })
  test("Независимые области", () => {
    expect({content: node.getAttribute("data-content-visible"), parameters: node.getAttribute("data-parameters-collapsed")},
      "Область компонента и поля параметров раскрываются независимо").toEqual({content: String(props.contentVisible), parameters: String(props.collapsed)})
  })
  test("Связи", () => {
    expect(node.querySelectorAll("[data-socket-id]").length, "Оба сокета остаются в ноде при любом сочетании раскрытия").toBe(2)
  })
  test("Сохранение содержимого", async () => {
    const area = node.querySelector("[data-node-content]")!
    const button = [...node.querySelectorAll("button")].find(item => item.getAttribute("aria-label") === (props.contentVisible ? "Скрыть содержимое" : "Показать содержимое"))!
    button.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    await Promise.resolve()
    await headless.capture(result)
    expect({sameArea: node.querySelector("[data-node-content]") === area, visible: node.getAttribute("data-content-visible"), collapsed: node.getAttribute("data-parameters-collapsed")},
      "Переключение содержимого сохраняет его элемент и состояние параметров").toEqual({sameArea: true, visible: String(!props.contentVisible), collapsed: String(props.collapsed)})
  })
})
