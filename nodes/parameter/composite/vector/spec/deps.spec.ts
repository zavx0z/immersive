import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "VectorParameter",
    file: "nodes/parameter/composite/vector/index.tsx",
    expected: {
      "nodes/parameter/composite/vector/index.tsx#VectorParameter": {
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/component/field/vector/index.tsx#VectorField"],
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
      "ui/component/field/group/index.tsx#FieldGroup": {
        uses: [],
        elements: ["div","span"],
      },
      "ui/component/field/number/index.tsx#NumberField": {
        uses: [],
        elements: ["button","div","input","span"],
      },
      "ui/component/field/vector/index.tsx#VectorField": {
        uses: ["ui/component/field/group/index.tsx#FieldGroup","ui/component/field/number/index.tsx#NumberField"],
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
