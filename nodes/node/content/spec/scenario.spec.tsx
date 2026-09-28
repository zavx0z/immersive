import {afterAll, describe, expect, test} from "bun:test"
import {createHeadless} from "@immersive/headless"
import {ContentNode} from "@nodes/node/content"
import {Typography} from "@zavx0z/ui/typography"
import {parameters, sockets} from "../../spec/fixture/parameters"

describe.each([
  {
    name: "Содержимое и параметры",
    props: {
      id: "open",
      label: "Нода с содержимым",
      parameters,
      sockets,
      collapsed: false,
      contentVisible: true
    },
    slots: {default: <Typography text="Произвольное содержимое" />},
    expected: {text: "Произвольное содержимое", images: 0},
  },
  {
    name: "Только содержимое",
    props: {
      id: "content",
      label: "Свёрнутые параметры",
      parameters,
      sockets,
      collapsed: true,
      contentVisible: true
    },
    slots: {default: <Typography text="Произвольное содержимое" />},
    expected: {text: "Произвольное содержимое", images: 0},
  },
  {
    name: "Только параметры",
    props: {
      id: "parameters",
      label: "Скрытое содержимое",
      parameters,
      sockets,
      collapsed: false,
      contentVisible: false
    },
    slots: {default: <Typography text="Произвольное содержимое" />},
    expected: {text: "Произвольное содержимое", images: 0},
  },
  {
    name: "Компактная нода",
    props: {
      id: "compact",
      label: "Компактная нода",
      parameters,
      sockets,
      collapsed: true,
      contentVisible: false
    },
    slots: {default: <Typography text="Произвольное содержимое" />},
    expected: {text: "Произвольное содержимое", images: 0},
  },
  {
    name: "Пустой слот",
    props: {
      id: "empty",
      label: "Нода без содержимого",
      parameters,
      sockets,
      collapsed: false,
      contentVisible: true
    },
    expected: {text: "", images: 0},
  },
])("$name", async ({props, slots = {}, expected}) => {
  const headless = createHeadless({width: 400, height: 560})
  afterAll(() => headless.dispose())
  const node = await headless.render(
    <ContentNode
      id={props.id}
      label={props.label}
      parameters={props.parameters}
      sockets={props.sockets}
      collapsed={props.collapsed}
      contentVisible={props.contentVisible}
    >
      {slots.default}
    </ContentNode>,
  )

  test("Одна нода", () => {
    expect({id: node.getAttribute("data-node-id"), nested: node.querySelectorAll("article[data-node-id]").length},
      "Содержимое и параметры образуют одну ноду графа").toEqual({id: props.id, nested: 0})
  })
  test("Независимые области", () => {
    expect({content: node.getAttribute("data-content-visible"), parameters: node.getAttribute("data-parameters-collapsed")},
      "Область компонента и поля параметров раскрываются независимо").toEqual({content: String(props.contentVisible), parameters: String(props.collapsed)})
  })
  test("Авторское содержимое", () => {
    const area = node.querySelector("[data-node-content]")!
    expect({text: area.textContent, images: area.querySelectorAll("img").length},
      "Область показывает только переданный слот; пустой слот не подставляет изображение или текст").toEqual(expected)
  })
  test("Связи", () => {
    expect(node.querySelectorAll("[data-socket-id]").length, "Оба сокета сохраняются при любом сочетании раскрытия").toBe(2)
  })

})
