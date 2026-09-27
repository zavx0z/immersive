import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {MouseEvent} from "@zavx0z/dom"
import {parameters, sockets} from "../../spec/fixture/parameters"
import {ContentsFixture} from "./fixture"

describe.each([
  {name: "Шапка", props: {id: "header", label: "Название ноды", category: "Категория", headerHeight: 28, parameters: [], sockets: [], action: false}},
  {name: "Параметр и сокеты", props: {id: "fields", label: "Поля ноды", category: "", headerHeight: 28, parameters: parameters.map(value => ({...value, presentation: {label: "Значение", readOnly: true}})), sockets, action: false}},
  {name: "Действие в шапке", props: {id: "action", label: "Нода с действием", category: "Команда", headerHeight: 28, parameters: [], sockets: [], action: true}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 560})
  afterAll(() => headless.dispose())
  const result = await headless.render(ContentsFixture, props)


  test("Название", () => {
    expect(result.querySelector("header")?.textContent, "Шапка показывает название и категорию ноды").toContain(props.label)
  })
  test("Состав", () => {
    expect({fields: result.querySelectorAll("input").length, sockets: result.querySelectorAll("[data-socket-id]").length, nodes: result.querySelectorAll("article[data-node-id]").length},
      "Составная часть показывает переданные поля и сокеты без создания второй ноды").toEqual({fields: props.parameters.length, sockets: props.sockets.length, nodes: 0})
  })
  /** @remarks Действие задано только в варианте с командой в шапке. */
  test.skipIf(!props.action)("Выполнение действия", async () => {
    const button = [...result.querySelectorAll("button")].find(item => item.getAttribute("aria-label") === "Проверить действие")!
    button.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    await Promise.resolve()
    await headless.capture(result)
    expect(result.querySelector("output")?.textContent, "Действие передаётся владельцу и обновляет состояние примера").toBe("1")
  })
})
