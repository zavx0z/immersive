import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "PathParameter",
    file: "nodes/parameter/path/index.tsx",
    expected: {
      "nodes/parameter/path/index.tsx#PathParameter": {
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/component/field/path/index.tsx#PathField"],
        elements: [],
      },
      "nodes/parameter/shared/layout/src/endpoint.tsx#ParameterEndpoints": {
        uses: [],
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
      "ui/component/button/basic/index.tsx#Button": {
        uses: [],
        elements: ["button","img","span"],
      },
      "ui/component/button/icon/index.tsx#IconButton": {
        uses: ["ui/component/button/basic/index.tsx#Button"],
        elements: [],
      },
      "ui/component/field/path/index.tsx#PathField": {
        uses: ["ui/component/button/icon/index.tsx#IconButton","ui/component/field/text/index.tsx#TextField"],
        elements: ["div","span"],
      },
      "ui/component/field/text/index.tsx#TextField": {
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
