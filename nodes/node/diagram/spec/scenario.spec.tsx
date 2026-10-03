import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import DiagramNode from "@nodes-node/diagram"
import type {NodesNodeDiagram} from "@nodes-node/diagram"
type DiagramNodeProps = NodesNodeDiagram.Input

describe.each([
  {
    name: "Прямоугольник",
    props: {id: "rectangle", description: "Описание занимает всю ноду", rect: {x: 40, y: 20, width: 240, height: 100}, shape: "rectangle"},
    size: {width: 240, height: 100},
  },
  {
    name: "Овал",
    props: {id: "oval", description: "Описание занимает всю ноду", rect: {x: 40, y: 20, width: 240, height: 100}, shape: "oval"},
    size: {width: 240, height: 100},
  },
  {
    name: "Круг",
    props: {id: "circle", description: "Описание занимает всю ноду", rect: {x: 40, y: 20, width: 240, height: 100}, shape: "circle"},
    size: {width: 240, height: 240},
  },
] satisfies {name: string, props: DiagramNodeProps, size: {width: number, height: number}}[])("$name", async ({props, size}) => {
  const headless = createHeadless({width: 320, height: 280})
  afterAll(() => headless.dispose())
  const node = await headless.render(
    <DiagramNode
      id={props.id}
      description={props.description}
      rect={props.rect}
      shape={props.shape}
    />,
  )

  test("Представление", () => {
    expect({tag: node.localName, shape: node.getAttribute("data-node-shape"), text: node.textContent},
      "Форма и описание принадлежат одной семантической ноде").toEqual({tag: "article", shape: props.shape, text: props.description})
  })
  test("Размеры", () => {
    const bounds = node.getBoundingClientRect()
    expect({width: bounds.width, height: bounds.height},
      "Прямоугольник и овал сохраняют размеры; у круга диаметр равен большей стороне").toEqual(size)
  })
  test("Снимок", async () => {
    const image = await headless.screenshot(node, "image")
    expect(await image.metadata(), "Снимок охватывает собственные границы ноды").toMatchObject(size)
  })
})
