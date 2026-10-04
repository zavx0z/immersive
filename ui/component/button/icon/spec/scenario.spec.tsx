import runIcon from "@immersive-ui-theme-icon/run"
/** IconButton показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import IconButton from "@immersive-ui-component-button/icon"

describe.each([{name: "Основное представление", props: {label: "Действие", iconSrc: runIcon}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <IconButton
      label={props.label}
      iconSrc={props.iconSrc}
     />
  )

  test("Содержимое", () => {
    expect(element.matches("button[aria-label=\"Действие\"]") || element.querySelector("button[aria-label=\"Действие\"]") !== null, "Публичное представление содержит доступный элемент управления").toBe(true)
  })
})
