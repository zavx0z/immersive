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
        uses: ["nodes/parameter/shared/layout/index.tsx#ParameterLayout","ui/field/color-field/index.tsx#ColorField"],
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
      "ui/field/color-field/index.tsx#ColorField": {
        uses: ["ui/button/button/index.tsx#Button","ui/field/color-picker-field/index.tsx#ColorPickerField"],
        elements: ["div","span"],
      },
      "ui/field/color-picker-field/src/helpers.tsx#CheckerCell": {
        uses: [],
        elements: ["span"],
      },
      "ui/field/color-picker-field/src/helpers.tsx#ColorChannelField": {
        uses: ["ui/field/number-field/index.tsx#NumberField","ui/field/slider-field/index.tsx#SliderField"],
        elements: ["div","span"],
      },
      "ui/field/color-picker-field/index.tsx#ColorPickerField": {
        uses: ["ui/field/color-picker-field/src/helpers.tsx#ColorChannelField","ui/field/color-picker-field/src/helpers.tsx#ColorSwatch","ui/field/text-field/index.tsx#TextField"],
        elements: ["div","span"],
      },
      "ui/field/color-picker-field/src/helpers.tsx#ColorSwatch": {
        uses: ["ui/field/color-picker-field/src/helpers.tsx#CheckerCell"],
        elements: ["div","span"],
      },
      "ui/field/number-field/index.tsx#NumberField": {
        uses: [],
        elements: ["button","div","input","span"],
      },
      "ui/field/slider-field/index.tsx#SliderField": {
        uses: [],
        elements: ["input","label","span"],
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
