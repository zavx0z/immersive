import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {MouseEvent} from "@zavx0z/dom"
import {parameters, sockets} from "../../spec/fixture/parameters"
import {ParameterFixture} from "./fixture"

describe.each([
  {name: "Число и сокеты", props: {id: "number", label: "Числовой параметр", parameters, sockets, collapsed: false}},
  {name: "Свёрнутая нода", props: {id: "collapsed", label: "Свёрнутая нода", parameters, sockets, collapsed: true}},
  {name: "Выбранная нода", props: {id: "selected", label: "Выбранная нода", parameters, sockets, collapsed: false, selected: true}},
  {name: "Пустая нода", props: {id: "empty", label: "Нода без параметров", parameters: [], sockets: [], collapsed: false}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 560})
  afterAll(() => headless.dispose())
  const result = await headless.render(ParameterFixture, props)

  const node = result.querySelector("article")!

  test("Представление", () => {
    expect({role: node.getAttribute("role"), label: node.getAttribute("aria-label"), kind: node.getAttribute("data-node-kind")},
      "Нода имеет собственное имя и содержит параметры выбранного примера").toEqual({role: "option", label: props.label, kind: "parameter"})
  })
  test("Поле и подключения", () => {
    expect({fields: node.querySelectorAll("input").length, sockets: node.querySelectorAll("[data-socket-id]").length},
      "Числовое поле и два адресуемых сокета принадлежат одной ноде; у пустого варианта их нет").toEqual({fields: props.parameters.length, sockets: props.sockets.length})
  })
  test("Начальное раскрытие", () => {
    expect(node.hasAttribute("data-collapsed"), "Свёрнутое состояние задано входом выбранного варианта").toBe(props.collapsed)
  })
  test("Переключение раскрытия", async () => {
    const button = [...node.querySelectorAll("button")].find(item => item.getAttribute("aria-label") === `${props.collapsed ? "Развернуть" : "Свернуть"} ${props.label}`)!
    button.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    await Promise.resolve()
    await headless.capture(result)
    expect(node.hasAttribute("data-collapsed"), "Нажатие шапки изменяет раскрытие через обработчик владельца").toBe(!props.collapsed)
  })
})
