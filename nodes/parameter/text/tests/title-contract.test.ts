import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@zavx0z/component"
import {createDocument, type Element} from "@zavx0z/dom"
import createJsxBunPlugin from "@jsx-compiler/bun"
import type {CompiledTemplate} from "@zavx0z/template/compiled"
import {Parameter as ParameterModel, type NodeJsonValue} from "@nodes/tree"

const root = resolve(import.meta.dir, "../../../..")
Bun.plugin(createJsxBunPlugin({
  cwd: root,
  persistent: true,
  sourceRoots: [resolve(root, "nodes/projection/parameter"), resolve(root, "nodes/parameter"), resolve(root, "nodes/socket"), resolve(root, "ui")],
}))

const {default: Parameter} = await import("@nodes/parameter-projection")
const {default: TextParameter} = await import("@nodes-parameters/text")
const {AuthoredText} = await import("../../shared/tests/authored.fixture")

test("[NODES-TITLE-003] Parameter проецирует description ровно на один видимый target", () => {
  const field = mount(TextParameter, {
    id: "text",
    nodeId: "node",
    label: "Текст",
    title: "Описание текста",
    value: "Значение",
  })
  expect(field.element.querySelector('[data-parameter-id="text"]')?.hasAttribute("title")).toBe(false)
  expect(titleTargets(field.element, "Описание текста")).toHaveLength(1)
  field.dispose()

  const connected = mount(AuthoredText, {
    id: "connected",
    nodeId: "node",
    label: "Связанный текст",
    title: "Описание связи",
    value: "Значение",
    connected: true,
    sockets: [{
      id: "in",
      kind: "string",
      direction: "input",
      side: "left",
      label: "Вход",
      connected: true,
    }],
  })
  expect(titleTargets(connected.element, "Описание связи")).toHaveLength(1)
  expect(connected.element.querySelector('[data-parameter-field] [title="Описание связи"]')).not.toBeNull()
  connected.dispose()

  const model = new ParameterModel<NodeJsonValue, NodeJsonValue>(
    "projected",
    "Значение",
    {label: "Проекция", description: "Описание проекции"},
    {id: "string", version: 1},
  )
  const projected = mount(Parameter, {
    nodeId: "node",
    snapshot: model.snapshot(),
    sockets: [],
  })
  expect(projected.element.querySelector('[data-parameter-id="projected"]')?.hasAttribute("title")).toBe(false)
  expect(titleTargets(projected.element, "Описание проекции")).toHaveLength(1)
  projected.dispose()
})

function mount<Props extends Readonly<Record<string, unknown>>>(component: unknown, props: Props) {
  const document = createDocument()
  const element = document.createElement("div")
  document.append(element)
  const componentRoot = createRoot(element)
  componentRoot.render(component as CompiledTemplate<Props>, props)
  return {
    element,
    dispose() {
      componentRoot.unmount()
      expect(element.childNodes).toHaveLength(0)
    },
  }
}

function titleTargets(element: Element, title: string): readonly Element[] {
  return [...element.querySelectorAll("[title]")].filter(candidate => candidate.getAttribute("title") === title)
}
