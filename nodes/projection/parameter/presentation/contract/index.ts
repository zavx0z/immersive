import type {NodesParameterStore} from "@nodes/parameter-store"
import type {NodeValuesOwn} from "@node-values/own"
import type {UiFieldsCollectionField} from "@ui-fields/collection-field"
import type {UiFieldsColorField} from "@ui-fields/color-field"
import type {UiFieldsReferenceField} from "@ui-fields/reference-field"
import type {UiFieldsSelectField} from "@ui-fields/select-field"
type JsonValue = NodeValuesOwn.Input[0]
type CollectionFieldProps = UiFieldsCollectionField.Input
type ColorFieldValue = NonNullable<UiFieldsColorField.Input["value"]>
type ReferenceFieldValue = NonNullable<UiFieldsReferenceField.Input["value"]>
type SelectFieldOption = NonNullable<UiFieldsSelectField.Input["options"]>[number]

type Kind =
  | "checkbox"
  | "collection"
  | "color"
  | "cycle"
  | "matrix"
  | "number"
  | "option-group"
  | "output"
  | "path"
  | "reference"
  | "select"
  | "slider"
  | "switch"
  | "text"
  | "vector"

/** Подготовленное представление одного снимка Parameter для UI и числового плана ноды. */
export declare namespace NodesParameterPresentation {
  type Input = ReturnType<NodesParameterStore.Output<JsonValue, JsonValue>["snapshot"]>

  type Output = Readonly<{
    kind: Kind
    label: string
    disabled: boolean
    readOnly: boolean
    labelHidden: boolean
    title: string | undefined
    min: number | undefined
    max: number | undefined
    rawStep: number | undefined
    step: number
    precision: number | undefined
    options: readonly SelectFieldOption[] | undefined
    placeholder: string | undefined
    axes: readonly string[] | undefined
    booleanValue: boolean
    numberValue: number
    stringValue: string
    vector: readonly number[] | null
    matrix: readonly (readonly number[])[] | null
    color: ColorFieldValue | null
    reference: ReferenceFieldValue | null | undefined
    collection: Readonly<{
      items: CollectionFieldProps["items"]
      selectedId: string | null
      visibleRows: number | undefined
    }> | null
  }>
}
