import type {Zavx0zImmersiveNodesModelParameterStore} from "@zavx0z/immersive-nodes-model-parameter-store"
import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {Zavx0zImmersiveUiComponentFieldCollection} from "@zavx0z/immersive-ui-component-field-collection"
import type {Zavx0zImmersiveUiComponentFieldColor} from "@zavx0z/immersive-ui-component-field-color"
import type {Zavx0zImmersiveUiComponentFieldReference} from "@zavx0z/immersive-ui-component-field-reference"
import type {Zavx0zImmersiveUiComponentFieldSelect} from "@zavx0z/immersive-ui-component-field-select"
type JsonValue = Zavx0zImmersiveTechJsonValueOwn.Input[0]
type CollectionFieldProps = Zavx0zImmersiveUiComponentFieldCollection.Input
type ColorFieldValue = NonNullable<Zavx0zImmersiveUiComponentFieldColor.Input["value"]>
type ReferenceFieldValue = NonNullable<Zavx0zImmersiveUiComponentFieldReference.Input["value"]>
type SelectFieldOption = NonNullable<Zavx0zImmersiveUiComponentFieldSelect.Input["options"]>[number]

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
export declare namespace Zavx0zImmersiveNodesProjectionParameterPresentation {
  type Input = ReturnType<Zavx0zImmersiveNodesModelParameterStore.Output<JsonValue, JsonValue>["snapshot"]>

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
