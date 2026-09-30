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
          "ui/surface/pane/index.tsx#Pane"
        ],
        "elements": [
          "article",
          "div"
        ]
      },
      "nodes/node/parameter/index.tsx#ParameterNode": {
        "uses": [
          "nodes/parameter/shared/parameter/index.tsx#Parameter",
          "nodes/socket/socket/index.tsx#Socket",
          "ui/button/button/index.tsx#Button",
          "ui/button/icon-button/index.tsx#IconButton"
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
          "ui/field/checkbox-field/index.tsx#CheckboxField"
        ],
        "elements": []
      },
      "nodes/parameter/boolean/switch/index.tsx#SwitchParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/switch-field/index.tsx#SwitchField"
        ],
        "elements": []
      },
      "nodes/parameter/choice/cycle/index.tsx#CycleParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/cycle-field/index.tsx#CycleField"
        ],
        "elements": []
      },
      "nodes/parameter/choice/option-group/index.tsx#OptionGroupParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/button/toggle-button-group/index.tsx#ToggleButtonGroup"
        ],
        "elements": []
      },
      "nodes/parameter/choice/select/index.tsx#SelectParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/select-field/index.tsx#SelectField"
        ],
        "elements": []
      },
      "nodes/parameter/collection/collection/index.tsx#CollectionParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/collection-field/index.tsx#CollectionField"
        ],
        "elements": []
      },
      "nodes/parameter/composite/color/index.tsx#ColorParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/color-field/index.tsx#ColorField"
        ],
        "elements": []
      },
      "nodes/parameter/composite/matrix/index.tsx#MatrixParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/matrix-field/index.tsx#MatrixField"
        ],
        "elements": []
      },
      "nodes/parameter/composite/vector/index.tsx#VectorParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/vector-field/index.tsx#VectorField"
        ],
        "elements": []
      },
      "nodes/parameter/numeric/number/index.tsx#NumberParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/number-field/index.tsx#NumberField"
        ],
        "elements": []
      },
      "nodes/parameter/numeric/slider/index.tsx#SliderParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/slider-field/index.tsx#SliderField"
        ],
        "elements": []
      },
      "nodes/parameter/output/output/index.tsx#OutputParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "nodes/parameter/shared/output/index.tsx#ParameterOutput"
        ],
        "elements": []
      },
      "nodes/parameter/reference/path/index.tsx#PathParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/path-field/index.tsx#PathField"
        ],
        "elements": []
      },
      "nodes/parameter/reference/reference/index.tsx#ReferenceParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/reference-field/index.tsx#ReferenceField"
        ],
        "elements": []
      },
      "nodes/parameter/shared/endpoint/index.tsx#ParameterEndpoints": {
        "uses": [
          "nodes/socket/socket/index.tsx#Socket"
        ],
        "elements": [
          "span"
        ]
      },
      "nodes/parameter/shared/label/index.tsx#ParameterLabel": {
        "uses": [],
        "elements": [
          "span"
        ]
      },
      "nodes/parameter/shared/layout/index.tsx#ParameterLayout": {
        "uses": [
          "nodes/parameter/shared/endpoint/index.tsx#ParameterEndpoints",
          "nodes/parameter/shared/label/index.tsx#ParameterLabel"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "nodes/parameter/shared/output/index.tsx#ParameterOutput": {
        "uses": [],
        "elements": [
          "output"
        ]
      },
      "nodes/parameter/shared/parameter/index.tsx#Parameter": {
        "uses": [
          "nodes/parameter/boolean/checkbox/index.tsx#CheckboxParameter",
          "nodes/parameter/boolean/switch/index.tsx#SwitchParameter",
          "nodes/parameter/choice/cycle/index.tsx#CycleParameter",
          "nodes/parameter/choice/option-group/index.tsx#OptionGroupParameter",
          "nodes/parameter/choice/select/index.tsx#SelectParameter",
          "nodes/parameter/collection/collection/index.tsx#CollectionParameter",
          "nodes/parameter/composite/color/index.tsx#ColorParameter",
          "nodes/parameter/composite/matrix/index.tsx#MatrixParameter",
          "nodes/parameter/composite/vector/index.tsx#VectorParameter",
          "nodes/parameter/numeric/number/index.tsx#NumberParameter",
          "nodes/parameter/numeric/slider/index.tsx#SliderParameter",
          "nodes/parameter/output/output/index.tsx#OutputParameter",
          "nodes/parameter/reference/path/index.tsx#PathParameter",
          "nodes/parameter/reference/reference/index.tsx#ReferenceParameter",
          "nodes/parameter/text/text/index.tsx#TextParameter"
        ],
        "elements": []
      },
      "nodes/parameter/text/text/index.tsx#TextParameter": {
        "uses": [
          "nodes/parameter/shared/layout/index.tsx#ParameterLayout",
          "ui/field/text-field/index.tsx#TextField"
        ],
        "elements": []
      },
      "nodes/socket/socket/index.tsx#Socket": {
        "uses": [],
        "elements": [
          "button",
          "span"
        ]
      },
      "ui/button/button/index.tsx#Button": {
        "uses": [],
        "elements": [
          "button",
          "img",
          "span"
        ]
      },
      "ui/button/icon-button/index.tsx#IconButton": {
        "uses": [
          "ui/button/button/index.tsx#Button"
        ],
        "elements": []
      },
      "ui/button/toggle-button-group/index.tsx#ToggleButtonGroup": {
        "uses": [
          "ui/button/button/index.tsx#Button"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/checkbox-field/index.tsx#CheckboxField": {
        "uses": [],
        "elements": [
          "input",
          "label",
          "span"
        ]
      },
      "ui/field/collection-field/index.tsx#CollectionField": {
        "uses": [
          "ui/field/collection-field/src/action-button.tsx#CollectionActionButton",
          "ui/view/list/index.tsx#List"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/collection-field/src/action-button.tsx#CollectionActionButton": {
        "uses": [
          "ui/button/icon-button/index.tsx#IconButton"
        ],
        "elements": []
      },
      "ui/field/color-field/index.tsx#ColorField": {
        "uses": [
          "ui/button/button/index.tsx#Button",
          "ui/field/color-picker-field/index.tsx#ColorPickerField"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/color-picker-field/src/helpers.tsx#CheckerCell": {
        "uses": [],
        "elements": [
          "span"
        ]
      },
      "ui/field/color-picker-field/src/helpers.tsx#ColorChannelField": {
        "uses": [
          "ui/field/number-field/index.tsx#NumberField",
          "ui/field/slider-field/index.tsx#SliderField"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/color-picker-field/index.tsx#ColorPickerField": {
        "uses": [
          "ui/field/color-picker-field/src/helpers.tsx#ColorChannelField",
          "ui/field/color-picker-field/src/helpers.tsx#ColorSwatch",
          "ui/field/text-field/index.tsx#TextField"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/color-picker-field/src/helpers.tsx#ColorSwatch": {
        "uses": [
          "ui/field/color-picker-field/src/helpers.tsx#CheckerCell"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/cycle-field/index.tsx#CycleField": {
        "uses": [
          "ui/button/button/index.tsx#Button",
          "ui/field/cycle-field/src/helpers.tsx#CycleOption"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/cycle-field/src/helpers.tsx#CycleOption": {
        "uses": [
          "ui/button/button/index.tsx#Button"
        ],
        "elements": []
      },
      "ui/field/field-group/index.tsx#FieldGroup": {
        "uses": [],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/matrix-field/index.tsx#MatrixField": {
        "uses": [
          "ui/field/matrix-field/src/helpers.tsx#MatrixRow"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/matrix-field/src/helpers.tsx#MatrixRow": {
        "uses": [
          "ui/field/field-group/index.tsx#FieldGroup",
          "ui/field/number-field/index.tsx#NumberField"
        ],
        "elements": []
      },
      "ui/field/number-field/index.tsx#NumberField": {
        "uses": [],
        "elements": [
          "button",
          "div",
          "input",
          "span"
        ]
      },
      "ui/field/path-field/index.tsx#PathField": {
        "uses": [
          "ui/button/icon-button/index.tsx#IconButton",
          "ui/field/text-field/index.tsx#TextField"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/reference-field/index.tsx#ReferenceField": {
        "uses": [
          "ui/button/button/index.tsx#Button",
          "ui/button/icon-button/index.tsx#IconButton"
        ],
        "elements": [
          "div",
          "span"
        ]
      },
      "ui/field/select-field/index.tsx#SelectField": {
        "uses": [
          "ui/field/select-field/src/helpers.tsx#SelectOption"
        ],
        "elements": [
          "label",
          "optgroup",
          "option",
          "select",
          "span"
        ]
      },
      "ui/field/select-field/src/helpers.tsx#SelectOption": {
        "uses": [],
        "elements": [
          "option"
        ]
      },
      "ui/field/slider-field/index.tsx#SliderField": {
        "uses": [],
        "elements": [
          "input",
          "label",
          "span"
        ]
      },
      "ui/field/switch-field/index.tsx#SwitchField": {
        "uses": [],
        "elements": [
          "button",
          "div",
          "span"
        ]
      },
      "ui/field/text-field/index.tsx#TextField": {
        "uses": [],
        "elements": [
          "input",
          "label",
          "span"
        ]
      },
      "ui/field/vector-field/index.tsx#VectorField": {
        "uses": [
          "ui/field/field-group/index.tsx#FieldGroup",
          "ui/field/number-field/index.tsx#NumberField"
        ],
        "elements": []
      },
      "ui/surface/pane/index.tsx#Pane": {
        "uses": [],
        "elements": [
          "section"
        ]
      },
      "ui/view/list/src/helpers.tsx#EmptyListRow": {
        "uses": [],
        "elements": [
          "li"
        ]
      },
      "ui/view/list/index.tsx#List": {
        "uses": [
          "ui/view/list/src/helpers.tsx#EmptyListRow",
          "ui/view/list/src/helpers.tsx#ListRow"
        ],
        "elements": [
          "ul"
        ]
      },
      "ui/view/list/src/helpers.tsx#ListRow": {
        "uses": [],
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
