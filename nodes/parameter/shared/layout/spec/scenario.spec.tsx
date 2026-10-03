/** Пользовательское содержимое сохраняется в слоте при подключении параметра. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import type {HTMLInputElement} from "@zavx0z/dom"
import CustomParameter from "./fixture"

describe.each([{name: "Поле", props: {connected: false}}, {name: "Подключение", props: {connected: true}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 120})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <CustomParameter
      connected={props.connected}
    />
  )
  test("Слот пользовательского поля", () => {
    expect((element.querySelector("input") as HTMLInputElement).value, "Содержимое слота не удаляется").toBe("Содержимое")
    expect(element.querySelector("[data-parameter-field]")?.hasAttribute("hidden"), "Видимость управляется общим состоянием подключения").toBe(props.connected)
  })
})
