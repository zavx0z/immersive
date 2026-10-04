import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import ParameterNode from "@immersive-nodes-node/parameter"
import {parameters, sockets} from "../../spec/fixture/parameters"

describe.each([
  {name: "Шапка", props: {id: "header", label: "Название ноды", category: "Категория", parameters: [], sockets: [], collapsed: false}},
  {name: "Число и сокеты", props: {id: "number", label: "Числовой параметр", parameters, sockets, collapsed: false}},
  {name: "Свёрнутая нода", props: {id: "collapsed", label: "Свёрнутая нода", parameters, sockets, collapsed: true}},
  {name: "Выбранная нода", props: {id: "selected", label: "Выбранная нода", parameters, sockets, collapsed: false, selected: true}},
  {name: "Пустая нода", props: {id: "empty", label: "Нода без параметров", parameters: [], sockets: [], collapsed: false}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 560})
  afterAll(() => headless.dispose())
  const node = await headless.render(
    <ParameterNode
      id={props.id}
      label={props.label}
      category={props.category}
      selected={props.selected}
      parameters={props.parameters}
      sockets={props.sockets}
      collapsed={props.collapsed}
    />
  )

  test("Представление", () => {
    expect({role: node.getAttribute("role"), label: node.getAttribute("aria-label"), id: node.getAttribute("data-node-id")},
      "Нода имеет собственное имя и адрес для подключения сокетов").toEqual({role: "option", label: props.label, id: props.id})
  })
  test("Шапка", () => {
    expect({label: node.querySelector("[data-node-label]")?.textContent.trim(), category: node.querySelector("small")?.textContent.trim()},
      "Название и категория находятся в шапке самой ноды").toEqual({label: props.label, category: props.category ?? ""})
  })
  test("Поле и подключения", () => {
    expect({fields: node.querySelectorAll("input").length, sockets: node.querySelectorAll("[data-socket-id]").length},
      "Переданные поля и адресуемые сокеты принадлежат одной ноде").toEqual({fields: props.parameters.length, sockets: props.sockets.length})
  })
  test("Начальное раскрытие", () => {
    expect(node.hasAttribute("data-collapsed"), "Входной collapsed задаёт раскрытие полей").toBe(props.collapsed)
  })

})
