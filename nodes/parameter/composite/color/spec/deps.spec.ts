import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../../..")

// Статический эталон включает все ветви собственного JSX и транзитивные компоненты.
// JSX, назначенный потребителем в слот, принадлежит графу его автора.
test.each([
  {
    name: "ColorParameter",
    file: "nodes/parameter/composite/color/index.tsx",
    expected: {
      "nodes/parameter/composite/color/index.tsx#ColorParameter": {
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/component/field/color/index.tsx#ColorField"],
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
      "ui/component/field/color/index.tsx#ColorField": {
        uses: ["ui/component/button/basic/index.tsx#Button","ui/component/field/color-picker/index.tsx#ColorPickerField"],
        elements: ["div","span"],
      },
      "ui/component/field/color-picker/src/helpers.tsx#CheckerCell": {
        uses: [],
        elements: ["span"],
      },
      "ui/component/field/color-picker/src/helpers.tsx#ColorChannelField": {
        uses: ["ui/component/field/number/index.tsx#NumberField","ui/component/field/slider/index.tsx#SliderField"],
        elements: ["div","span"],
      },
      "ui/component/field/color-picker/index.tsx#ColorPickerField": {
        uses: ["ui/component/field/color-picker/src/helpers.tsx#ColorChannelField","ui/component/field/color-picker/src/helpers.tsx#ColorSwatch","ui/component/field/text/index.tsx#TextField"],
        elements: ["div","span"],
      },
      "ui/component/field/color-picker/src/helpers.tsx#ColorSwatch": {
        uses: ["ui/component/field/color-picker/src/helpers.tsx#CheckerCell"],
        elements: ["div","span"],
      },
      "ui/component/field/number/index.tsx#NumberField": {
        uses: [],
        elements: ["button","div","input","span"],
      },
      "ui/component/field/slider/index.tsx#SliderField": {
        uses: [],
        elements: ["input","label","span"],
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
