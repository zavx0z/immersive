/** Пользовательское содержимое сохраняется в слоте при подключении параметра. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import type {HTMLInputElement} from "@zavx0z/dom"
import ParameterLayout from "@nodes-parameters/layout"
import TextField from "@ui-fields/text-field"

describe.each([{name: "Поле", props: {connected: false}}, {name: "Подключение", props: {connected: true}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 400, height: 120})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ParameterLayout
      id="custom"
      nodeId="source"
      label="Свой параметр"
      kind="custom"
      connected={props.connected}
    >
      <TextField value="Содержимое" />
    </ParameterLayout>
  )
  test("Слот пользовательского поля", () => {
    expect((element.querySelector("input") as HTMLInputElement).value, "Содержимое слота не удаляется").toBe("Содержимое")
    expect(element.querySelector("[data-parameter-field]")?.hasAttribute("hidden"), "Подключение не скрывает пользовательское поле").toBe(false)
  })
})
