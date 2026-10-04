import type {ImmersiveNodesModelParameterStore} from "@zavx0z/immersive-nodes-model-parameter-store"
import type {ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {ImmersiveUiComponentFieldCollection} from "@zavx0z/immersive-ui-component-field-collection"
import type {ImmersiveUiComponentFieldColor} from "@zavx0z/immersive-ui-component-field-color"
import type {ImmersiveUiComponentFieldReference} from "@zavx0z/immersive-ui-component-field-reference"
import type {ImmersiveUiComponentFieldSelect} from "@zavx0z/immersive-ui-component-field-select"
type JsonValue = ImmersiveTechJsonValueOwn.Input[0]
type CollectionFieldProps = ImmersiveUiComponentFieldCollection.Input
type ColorFieldValue = NonNullable<ImmersiveUiComponentFieldColor.Input["value"]>
type ReferenceFieldValue = NonNullable<ImmersiveUiComponentFieldReference.Input["value"]>
type SelectFieldOption = NonNullable<ImmersiveUiComponentFieldSelect.Input["options"]>[number]

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
export declare namespace ImmersiveNodesProjectionParameterPresentation {
  type Input = ReturnType<ImmersiveNodesModelParameterStore.Output<JsonValue, JsonValue>["snapshot"]>

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
