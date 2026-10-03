import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "OutputParameter",
    file: "nodes/parameter/output/output/index.tsx",
    expected: {
      "nodes/parameter/output/output/index.tsx#OutputParameter": {
        uses: ["nodes/parameter/output/output/src/output.tsx#ParameterOutput","nodes/parameter/shared/layout/index.tsx#ParameterLayout"],
        elements: [],
      },
      "nodes/parameter/shared/layout/src/endpoint.tsx#ParameterEndpoints": {
        uses: ["nodes/socket/index.tsx#Socket"],
        elements: ["span"],
      },
      "nodes/parameter/shared/layout/src/label.tsx#ParameterLabel": {
        uses: [],
        elements: ["span"],
      },
      "nodes/parameter/shared/layout/index.tsx#ParameterLayout": {
        uses: ["nodes/parameter/shared/layout/src/endpoint.tsx#ParameterEndpoints","nodes/parameter/shared/layout/src/label.tsx#ParameterLabel"],
        elements: ["div","span"],
      },
      "nodes/parameter/output/output/src/output.tsx#ParameterOutput": {
        uses: [],
        elements: ["output"],
      },
      "nodes/socket/index.tsx#Socket": {
        uses: [],
        elements: ["button","span"],
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
