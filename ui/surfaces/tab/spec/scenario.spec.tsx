import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {Button} from "@zavx0z/ui/buttons/button"
import {Tab} from "@zavx0z/ui/surfaces/tab"
import type {TabProps} from "../contract/input.ts"

/** Контент параметризуется снаружи; положение — во вложенной таблице того же примера. */
type Content = Readonly<{name: string; props: TabProps}>
type Scenario = Readonly<{
  name: string
  props: TabProps & {position: NonNullable<TabProps["position"]>}
}>

describe.each([
  {name: "label", props: {label: "Tab", children: null}},
  {
    name: "children",
    props: {
      label: null,
      children: <Button
        label="Инструменты"
      />,
    },
  },
] satisfies Content[])("$name", ({props: content}: Content) => {
  describe.each([
    {name: "Слева", props: {...content, position: {edge: "left", offset: .5}}},
    {name: "Справа", props: {...content, position: {edge: "right", offset: .5}}},
    {name: "Снизу", props: {...content, position: {edge: "bottom", offset: .5}}},
    {name: "Сверху", props: {...content, position: {edge: "top", offset: .5}}},
  ] satisfies Scenario[])("$name", async ({props}: Scenario) => {
    const headless = createHeadless({width: 600, height: 320})
    afterAll(() => headless.dispose())
    const element = await headless.render(
      <Tab
        label={props.label}
        position={props.position}
      >
        {props.children}
      </Tab>,
    )
    await headless.capture(element)
    const tab = element.querySelector("[data-tab]")!

    test("Положение", () => {
      expect(tab.getAttribute("data-edge"), "Tab находится на стороне, заданной position").toBe(props.position.edge)
      expect(tab.getAttribute("data-ready"), "Геометрия принимающей области доступна табу").toBe("true")
      const bounds = tab.getLayoutRect(element)!
      const edge = props.position.edge
      if (edge === "left") expect(bounds.x, "Левый край таба совпадает с краем области").toBe(0)
      if (edge === "right") expect(bounds.right, "Правый край таба совпадает с краем области").toBe(600)
      if (edge === "top") expect(bounds.y, "Верхний край таба совпадает с краем области").toBe(0)
      if (edge === "bottom") expect(bounds.bottom, "Нижний край таба совпадает с краем области").toBe(320)
    })

    test("Контент", () => {
      if (props.children == null) {
        expect(tab.textContent, "Текст label отображается внутри Tab").toBe(props.label!)
        expect(tab.querySelector("button"), "Текстовая подпись не создаёт дочернюю кнопку").toBeNull()
        const bounds = tab.querySelector("span")!.getLayoutRect(element)!
        const vertical = props.position.edge === "left" || props.position.edge === "right"
        expect(bounds.height > bounds.width, "На боковых сторонах подпись идёт вдоль вертикального края").toBe(vertical)
      } else {
        expect(tab.querySelector("button")?.textContent, "Tab принимает дочернюю кнопку без обязательного label").toBe("Инструменты")
        const bounds = tab.querySelector("button span")!.getLayoutRect(element)!
        const buttonBounds = tab.querySelector("button")!.getLayoutRect(element)!
        const vertical = props.position.edge === "left" || props.position.edge === "right"
        expect(bounds.height > bounds.width, "Текст дочерней кнопки наследует направление Tab").toBe(vertical)
        expect(bounds.y, "Начало надписи помещается внутри кнопки").toBeGreaterThanOrEqual(buttonBounds.y)
        expect(bounds.bottom, "Конец надписи помещается внутри кнопки").toBeLessThanOrEqual(buttonBounds.bottom)
      }
    })
  })
})
