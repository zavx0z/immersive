import {afterEach, beforeEach, describe, expect, test} from "bun:test"
import {createHeadless, type Headless} from "../index.ts"
import {TextBox, FillBox} from "../fixtures/elements.tsx"

describe("статический JSX", () => {
  let headless: Headless

  beforeEach(() => {
    headless = createHeadless({width: 320, height: 180, styleSheetSources: []})
  })

  afterEach(async () => {
    await headless.dispose()
  })

  const scenarioElement = (
    <TextBox
      text="Статический JSX"
    />
  )

  test("[HEADLESS-STATIC-JSX] статический компонент монтируется из одного JSX-аргумента", async () => {
    const element = await headless.render(scenarioElement)

    expect(element.isConnected).toBe(true)
    expect(element.localName).toBe("article")
    expect(element.textContent).toBe("Статический JSX")
  })

  test("процентные размеры компонента разрешаются от рабочей области Headless", async () => {
    const element = await headless.render(<FillBox />)
    const frame = await headless.capture(element)
    expect([frame.width, frame.height]).toEqual([320, 180])
    expect([...frame.rgba.slice(0, 4)]).toEqual([36, 104, 172, 255])
  })

  test("renderComponent обновляет тот же компонент отдельными props", async () => {
    const first = await headless.render(<TextBox text="JSX" />)
    const updated = await headless.renderComponent(TextBox, {text: "Отдельные props"})
    expect(updated).toBe(first)
    expect(updated.textContent).toBe("Отдельные props")
  })

  test("render принимает ровно один JSX-аргумент", async () => {
    // @ts-expect-error Контракт render имеет только один JSX-аргумент.
    await expect(headless.render(TextBox, {text: "Два аргумента"})).rejects.toThrow("один JSX-аргумент")
  })

})
