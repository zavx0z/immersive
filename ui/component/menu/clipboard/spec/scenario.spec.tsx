/** ClipboardMenu показывает публичное использование своего владельца. */
import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@zavx0z/immersive-headless"
import ClipboardMenu from "@zavx0z/immersive-ui-component-menu-clipboard"

const state = Object.freeze({open: true, x: 0, y: 0, canCopy: true, canPaste: false, pending: false, error: null})
const controller = {getSnapshot: () => state, subscribe() { return () => {} }, async copy() {}, async paste() {}, close() {}}

describe.each([{name: "Основное представление", props: {controller}}])("$name", async ({props}) => {
  const headless = createHeadless({width: 640, height: 400})
  afterAll(() => headless.dispose())
  const element = await headless.render(
    <ClipboardMenu
      controller={props.controller}
     />
  )

  test("Содержимое", () => {
    expect(element.textContent, "Представление показывает переданное значение").toContain("Копировать")
  })
})
