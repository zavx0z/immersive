import {expect, test} from "bun:test"
import {resolve} from "node:path"
import {buildComponentDependencyGraph, type ComponentDependencyGraph} from "../../../../fixtures/dependency-graph.ts"

const root = resolve(import.meta.dir, "../../../..")

// Полный статический эталон включает все ветви JSX и транзитивные компоненты.
test.each([
  {
    "name": "ContentNode",
    "file": "nodes/node/content/index.tsx",
    "expected": {
      "nodes/node/content/index.tsx#ContentNode": {
        "uses": [
          "nodes/node/parameter/index.tsx#ParameterNode",
          "ui/component/surface/pane/index.tsx#Pane",
        ],
        "elements": [
          "article",
          "div"
        ]
      },
      "nodes/node/parameter/index.tsx#ParameterNode": {
        "uses": [
          "nodes/projection/parameter/index.tsx#Parameter",
          "nodes/socket/index.tsx#Socket",
          "ui/component/button/basic/index.tsx#Button",
          "ui/component/button/icon/index.tsx#IconButton",
        ],
        "elements": [
          "article",
          "header",
          "section",
          "small",
          "strong"
        ]
      },
      "nodes/parameter/boolean/checkbox/index.tsx#CheckboxParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/checkbox/index.tsx#CheckboxField",
        ],
        "elements": []
      },
      "nodes/parameter/boolean/switch/index.tsx#SwitchParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/switch/index.tsx#SwitchField",
        ],
        "elements": []
      },
      "nodes/parameter/choice/cycle/index.tsx#CycleParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/cycle/index.tsx#CycleField",
        ],
        "elements": []
      },
      "nodes/parameter/choice/option-group/index.tsx#OptionGroupParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/button/toggle-group/index.tsx#ToggleButtonGroup",
          "ui/component/field/group/index.tsx#FieldGroup",
        ],
        "elements": []
      },
      "nodes/parameter/choice/select/index.tsx#SelectParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/select/index.tsx#SelectField",
        ],
        "elements": []
      },
      "nodes/parameter/collection/index.tsx#CollectionParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/collection/index.tsx#CollectionField",
        ],
        "elements": []
      },
      "nodes/parameter/composite/color/index.tsx#ColorParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/color/index.tsx#ColorField",
        ],
        "elements": []
      },
      "nodes/parameter/composite/matrix/index.tsx#MatrixParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/matrix/index.tsx#MatrixField",
        ],
        "elements": []
      },
      "nodes/parameter/composite/vector/index.tsx#VectorParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/vector/index.tsx#VectorField",
        ],
        "elements": []
      },
      "nodes/parameter/numeric/number/index.tsx#NumberParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/number/index.tsx#NumberField",
        ],
        "elements": []
      },
      "nodes/parameter/numeric/slider/index.tsx#SliderParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/slider/index.tsx#SliderField",
        ],
        "elements": []
      },
      "nodes/parameter/output/index.tsx#OutputParameter": {
        "uses": [
          "nodes/parameter/output/src/output.tsx#ParameterOutput",
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/group/index.tsx#FieldGroup",
        ],
        "elements": []
      },
      "nodes/parameter/path/index.tsx#PathParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/path/index.tsx#PathField",
        ],
        "elements": []
      },
      "nodes/parameter/reference/index.tsx#ReferenceParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/reference/index.tsx#ReferenceField",
        ],
        "elements": []
      },
      "nodes/parameter/shared/layout/src/endpoint.tsx#ParameterEndpoints": {
        "uses": [
        ],
        "elements": [
          "span"
        ]
      },
      "nodes/parameter/shared/layout/index.tsx#ParameterLayout": {
        "uses": [
          "nodes/parameter/shared/layout/src/endpoint.tsx#ParameterEndpoints",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "nodes/parameter/output/src/output.tsx#ParameterOutput": {
        "uses": [
        ],
        "elements": [
          "output"
        ]
      },
      "nodes/projection/parameter/index.tsx#Parameter": {
        "uses": [
          "nodes/parameter/boolean/checkbox/index.tsx#CheckboxParameter",
          "nodes/parameter/boolean/switch/index.tsx#SwitchParameter",
          "nodes/parameter/choice/cycle/index.tsx#CycleParameter",
          "nodes/parameter/choice/option-group/index.tsx#OptionGroupParameter",
          "nodes/parameter/choice/select/index.tsx#SelectParameter",
          "nodes/parameter/collection/index.tsx#CollectionParameter",
          "nodes/parameter/composite/color/index.tsx#ColorParameter",
          "nodes/parameter/composite/matrix/index.tsx#MatrixParameter",
          "nodes/parameter/composite/vector/index.tsx#VectorParameter",
          "nodes/parameter/numeric/number/index.tsx#NumberParameter",
          "nodes/parameter/numeric/slider/index.tsx#SliderParameter",
          "nodes/parameter/output/index.tsx#OutputParameter",
          "nodes/parameter/path/index.tsx#PathParameter",
          "nodes/parameter/reference/index.tsx#ReferenceParameter",
          "nodes/parameter/text/index.tsx#TextParameter",
          "nodes/socket/index.tsx#Socket",
        ],
        "elements": []
      },
      "nodes/parameter/text/index.tsx#TextParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/component/field/text/index.tsx#TextField",
        ],
        "elements": []
      },
      "nodes/socket/index.tsx#Socket": {
        "uses": [
        ],
        "elements": [
          "button",
          "span"
        ]
      },
      "ui/component/button/basic/index.tsx#Button": {
        "uses": [
        ],
        "elements": [
          "button",
          "img",
          "span"
        ]
      },
      "ui/component/button/icon/index.tsx#IconButton": {
        "uses": [
          "ui/component/button/basic/index.tsx#Button",
        ],
        "elements": []
      },
      "ui/component/button/toggle-group/index.tsx#ToggleButtonGroup": {
        "uses": [
          "ui/component/button/basic/index.tsx#Button",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/checkbox/index.tsx#CheckboxField": {
        "uses": [
        ],
        "elements": [
          "input",
          "label",
          "span"
        ]
      },
      "ui/component/field/collection/index.tsx#CollectionField": {
        "uses": [
          "ui/component/field/collection/src/action-button.tsx#CollectionActionButton",
          "ui/component/view/list/index.tsx#List",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/collection/src/action-button.tsx#CollectionActionButton": {
        "uses": [
          "ui/component/button/icon/index.tsx#IconButton",
        ],
        "elements": []
      },
      "ui/component/field/color/index.tsx#ColorField": {
        "uses": [
          "ui/component/button/basic/index.tsx#Button",
          "ui/component/field/color-picker/index.tsx#ColorPickerField",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/color-picker/src/helpers.tsx#CheckerCell": {
        "uses": [
        ],
        "elements": [
          "span"
        ]
      },
      "ui/component/field/color-picker/src/helpers.tsx#ColorChannelField": {
        "uses": [
          "ui/component/field/number/index.tsx#NumberField",
          "ui/component/field/slider/index.tsx#SliderField",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/color-picker/index.tsx#ColorPickerField": {
        "uses": [
          "ui/component/field/color-picker/src/helpers.tsx#ColorChannelField",
          "ui/component/field/color-picker/src/helpers.tsx#ColorSwatch",
          "ui/component/field/text/index.tsx#TextField",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/color-picker/src/helpers.tsx#ColorSwatch": {
        "uses": [
          "ui/component/field/color-picker/src/helpers.tsx#CheckerCell",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/cycle/index.tsx#CycleField": {
        "uses": [
          "ui/component/button/basic/index.tsx#Button",
          "ui/component/field/cycle/src/helpers.tsx#CycleOption",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/cycle/src/helpers.tsx#CycleOption": {
        "uses": [
          "ui/component/button/basic/index.tsx#Button",
        ],
        "elements": []
      },
      "ui/component/field/group/index.tsx#FieldGroup": {
        "uses": [
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/matrix/index.tsx#MatrixField": {
        "uses": [
          "ui/component/field/matrix/src/helpers.tsx#MatrixRow",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/matrix/src/helpers.tsx#MatrixRow": {
        "uses": [
          "ui/component/field/group/index.tsx#FieldGroup",
          "ui/component/field/number/index.tsx#NumberField",
        ],
        "elements": []
      },
      "ui/component/field/number/index.tsx#NumberField": {
        "uses": [
        ],
        "elements": [
          "button",
          "div",
          "input",
          "span"
        ]
      },
      "ui/component/field/path/index.tsx#PathField": {
        "uses": [
          "ui/component/button/icon/index.tsx#IconButton",
          "ui/component/field/text/index.tsx#TextField",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/reference/index.tsx#ReferenceField": {
        "uses": [
          "ui/component/button/basic/index.tsx#Button",
          "ui/component/button/icon/index.tsx#IconButton",
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/component/field/select/index.tsx#SelectField": {
        "uses": [
          "ui/component/field/select/src/helpers.tsx#SelectOption",
        ],
        "elements": [
          "label",
          "optgroup",
          "option",
          "select",
          "span"
        ]
      },
      "ui/component/field/select/src/helpers.tsx#SelectOption": {
        "uses": [
        ],
        "elements": [
          "option"
        ]
      },
      "ui/component/field/slider/index.tsx#SliderField": {
        "uses": [
        ],
        "elements": [
          "input",
          "label",
          "span"
        ]
      },
      "ui/component/field/switch/index.tsx#SwitchField": {
        "uses": [
        ],
        "elements": [
          "button",
          "div",
          "span"
        ]
      },
      "ui/component/field/text/index.tsx#TextField": {
        "uses": [
        ],
        "elements": [
          "input",
          "label",
          "span"
        ]
      },
      "ui/component/field/vector/index.tsx#VectorField": {
        "uses": [
          "ui/component/field/group/index.tsx#FieldGroup",
          "ui/component/field/number/index.tsx#NumberField",
        ],
        "elements": []
      },
      "ui/component/surface/pane/index.tsx#Pane": {
        "uses": [
        ],
        "elements": [
          "section"
        ]
      },
      "ui/component/view/list/src/helpers.tsx#EmptyListRow": {
        "uses": [
        ],
        "elements": [
          "li"
        ]
      },
      "ui/component/view/list/index.tsx#List": {
        "uses": [
          "ui/component/view/list/src/helpers.tsx#EmptyListRow",
          "ui/component/view/list/src/helpers.tsx#ListRow",
        ],
        "elements": [
          "ul"
        ]
      },
      "ui/component/view/list/src/helpers.tsx#ListRow": {
        "uses": [
        ],
        "elements": [
          "img",
          "li",
          "span"
        ]
      }
    }
  },
] satisfies {
  name: string,
  file: string,
  expected: ComponentDependencyGraph
}[])("[NODE-DEPENDENCIES] $name: полный граф компонентов и нативных элементов", async ({name, file, expected}) => {
  const graph = await buildComponentDependencyGraph(root, {
    file: resolve(root, file),
    name,
  })

  expect(graph, `Полный граф зависимостей ${name} должен совпадать с эталоном без пропущенных или лишних компонентов, связей и нативных элементов`).toEqual(expected)
}, 30_000)
