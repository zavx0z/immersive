import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {createRoot} from "@zavx0z/component"
import {createDocument, type Element} from "@zavx0z/dom"
import createJsxBunPlugin from "@jsx-compiler/bun"
import type {CompiledTemplate} from "@zavx0z/template/compiled"

const root = resolve(import.meta.dir, "../../..")
Bun.plugin(createJsxBunPlugin({
  cwd: root,
  persistent: true,
  sourceRoots: [resolve(root, "nodes/parameter"), resolve(root, "nodes/socket"), resolve(root, "ui")],
}))

const {default: Socket} = await import("@nodes/sockets")

test("[NODES-TITLE-002] Socket учитывает видимую row-подпись и сохраняет endpoint/type/description", () => {
  const endpoint = mount(Socket, socketProps({presentation: "endpoint"}))
  expect(endpoint.element.querySelector("button")?.getAttribute("title")).toBe("Float · Float")
  endpoint.dispose()

  const visibleType = mount(Socket, socketProps({presentation: "row"}))
  expect(visibleType.element.querySelector("button")?.hasAttribute("title")).toBe(false)
  visibleType.dispose()

  const additionalType = mount(Socket, socketProps({presentation: "row", label: "Значение"}))
  expect(additionalType.element.querySelector("button")?.getAttribute("title")).toBe("Float")
  additionalType.dispose()

  const description = mount(Socket, socketProps({
    presentation: "row",
    label: "Значение",
    title: "Числовой результат",
  }))
  expect(description.element.querySelector("button")?.getAttribute("title")).toBe("Числовой результат")
  description.dispose()
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

function socketProps(overrides: Readonly<Record<string, unknown>>) {
  return {
    id: "value",
    nodeId: "node",
    kind: "float" as const,
    direction: "output" as const,
    side: "right" as const,
    label: "Float",
    ...overrides,
  }
}
