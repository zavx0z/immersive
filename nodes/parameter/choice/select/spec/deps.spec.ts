import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "SelectParameter",
    file: "nodes/parameter/choice/select/index.tsx",
    expected: {
      "nodes/parameter/choice/select/index.tsx#SelectParameter": {
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/field/select-field/index.tsx#SelectField"],
        elements: [],
      },
      "nodes/parameter/shared/endpoint/index.tsx#ParameterEndpoints": {
        uses: ["nodes/socket/socket/index.tsx#Socket"],
        elements: ["span"],
      },
      "nodes/parameter/shared/label/index.tsx#ParameterLabel": {
        uses: [],
        elements: ["span"],
      },
      "nodes/parameter/shared/layout/index.tsx#ParameterLayout": {
        uses: ["nodes/parameter/shared/endpoint/index.tsx#ParameterEndpoints","nodes/parameter/shared/label/index.tsx#ParameterLabel"],
        elements: ["div","span"],
      },
      "nodes/socket/socket/index.tsx#Socket": {
        uses: [],
        elements: ["button","span"],
      },
      "ui/field/select-field/index.tsx#SelectField": {
        uses: ["ui/field/select-field/src/helpers.tsx#SelectOption"],
        elements: ["label","optgroup","option","select","span"],
      },
      "ui/field/select-field/src/helpers.tsx#SelectOption": {
        uses: [],
        elements: ["option"],
      },
    },
  },
] satisfies {
  name: string,
  file: string,
  expected: ComponentDependencyGraph
}[])("[COMPONENT-DEPENDENCIES] $name: полный статический граф JSX", async ({name, file, expected}) => {
  const graph = await buildComponentDependencyGraph(root, {
    file: resolve(root, file),
    name,
  })

  expect(graph, `Статический граф JSX ${name} должен совпадать с эталоном без пропущенных или лишних компонентов, связей и нативных элементов`).toEqual(expected)
}, 30_000)
