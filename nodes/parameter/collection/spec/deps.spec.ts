import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "CollectionParameter",
    file: "nodes/parameter/collection/index.tsx",
    expected: {
      "nodes/parameter/collection/index.tsx#CollectionParameter": {
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/component/field/collection/index.tsx#CollectionField"],
        elements: [],
      },
      "nodes/parameter/shared/layout/src/endpoint.tsx#ParameterEndpoints": {
        uses: [],
        elements: ["span"],
      },
      "nodes/parameter/shared/layout/index.tsx#ParameterLayout": {
        uses: ["nodes/parameter/shared/layout/src/endpoint.tsx#ParameterEndpoints"],
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
      "ui/component/field/collection/index.tsx#CollectionField": {
        uses: ["ui/component/field/collection/src/action-button.tsx#CollectionActionButton","ui/component/view/list/index.tsx#List"],
        elements: ["div","span"],
      },
      "ui/component/field/collection/src/action-button.tsx#CollectionActionButton": {
        uses: ["ui/component/button/icon/index.tsx#IconButton"],
        elements: [],
      },
      "ui/component/view/list/src/helpers.tsx#EmptyListRow": {
        uses: [],
        elements: ["li"],
      },
      "ui/component/view/list/index.tsx#List": {
        uses: ["ui/component/view/list/src/helpers.tsx#EmptyListRow","ui/component/view/list/src/helpers.tsx#ListRow"],
        elements: ["ul"],
      },
      "ui/component/view/list/src/helpers.tsx#ListRow": {
        uses: [],
        elements: ["img","li","span"],
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
