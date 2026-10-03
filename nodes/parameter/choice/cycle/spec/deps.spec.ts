import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "CycleParameter",
    file: "nodes/parameter/choice/cycle/index.tsx",
    expected: {
      "nodes/parameter/choice/cycle/index.tsx#CycleParameter": {
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/field/cycle-field/index.tsx#CycleField"],
        elements: [],
      },
      "nodes/parameter/shared/endpoint/index.tsx#ParameterEndpoints": {
        uses: ["nodes/socket/index.tsx#Socket"],
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
      "nodes/socket/index.tsx#Socket": {
        uses: [],
        elements: ["button","span"],
      },
      "ui/button/button/index.tsx#Button": {
        uses: [],
        elements: ["button","img","span"],
      },
      "ui/field/cycle-field/index.tsx#CycleField": {
        uses: ["ui/button/button/index.tsx#Button","ui/field/cycle-field/src/helpers.tsx#CycleOption"],
        elements: ["div","span"],
      },
      "ui/field/cycle-field/src/helpers.tsx#CycleOption": {
        uses: ["ui/button/button/index.tsx#Button"],
        elements: [],
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
