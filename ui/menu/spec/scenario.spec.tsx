/** Общая семантика меню сохраняется у самостоятельной команды, списка и командного порта. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import MenuExamples from "./fixture"

describe.each([
  {name: "Доступные команды", props: {disabled: false}},
  {name: "Недоступные команды", props: {disabled: true}},
])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <MenuExamples
      disabled={props.disabled}
    />
  )
  test("Общий Document", () => {
    const items = [...element.querySelectorAll('[role="menuitem"]')]
    expect(items, "Команда, список и ClipboardMenu возвращают ровно свои четыре семантических пункта меню").toHaveLength(4)
    expect(items.every(item => item.ownerDocument === element.ownerDocument),
      "Самостоятельные участники используют Document принимающего Experience").toBeTrue()
  })
  test("Внешняя доступность команды", () => {
    const command = [...element.querySelectorAll('[role="menuitem"]')].find(item => item.textContent?.includes("Самостоятельная команда"))!
    expect(command.hasAttribute("disabled"), "Состояние команды сохраняется из собственного протокола MenuItem").toBe(props.disabled)
    const copy = [...element.querySelectorAll('[role="menuitem"]')].find(item => item.textContent?.includes("Копировать"))!
    expect(copy.hasAttribute("disabled"), "ClipboardMenu сохраняет доступность команды из внешнего порта").toBe(props.disabled)
  })
})
