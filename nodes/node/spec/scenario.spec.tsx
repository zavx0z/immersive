/** Разные представления сохраняют адрес и внешнее состояние ноды в общем Document. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import NodeExamples from "./fixture"

describe.each([
  {name: "Ноды", props: {selected: false, hidden: false}},
  {name: "Выбранные ноды", props: {selected: true, hidden: false}},
  {name: "Скрытые ноды", props: {selected: false, hidden: true}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 1000, height: 1000})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <NodeExamples
      selected={props.selected}
      hidden={props.hidden}
    />
  )
  test("Общий протокол ноды", () => {
    const nodes = [...element.querySelectorAll("[data-node-id]")]
    expect(nodes.map(node => node.getAttribute("data-node-id")), "Каждый участник сохраняет один собственный адрес").toEqual(["diagram", "parameter", "content"])
    expect(nodes.map(node => node.getAttribute("aria-selected")), "Выбор остаётся у вызывающего владельца").toEqual(Array(3).fill(String(props.selected)))
    expect(nodes.map(node => node.hasAttribute("hidden")), "Скрытие не удаляет элементы").toEqual(Array(3).fill(props.hidden))
    expect(nodes.every(node => node.ownerDocument === element.ownerDocument), "Представления принадлежат одному Document").toBeTrue()
    expect(element.querySelectorAll("canvas"), "Ноды не создают собственный Canvas").toHaveLength(0)
  })
})
