import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "PathParameter",
    file: "nodes/parameter/reference/path/index.tsx",
    expected: {
      "nodes/parameter/reference/path/index.tsx#PathParameter": {
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/field/path-field/index.tsx#PathField"],
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
      "nodes/socket/index.tsx#Socket": {
        uses: [],
        elements: ["button","span"],
      },
      "ui/button/button/index.tsx#Button": {
        uses: [],
        elements: ["button","img","span"],
      },
      "ui/button/icon-button/index.tsx#IconButton": {
        uses: ["ui/button/button/index.tsx#Button"],
        elements: [],
      },
      "ui/field/path-field/index.tsx#PathField": {
        uses: ["ui/button/icon-button/index.tsx#IconButton","ui/field/text-field/index.tsx#TextField"],
        elements: ["div","span"],
      },
      "ui/field/text-field/index.tsx#TextField": {
        uses: [],
        elements: ["input","label","span"],
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
