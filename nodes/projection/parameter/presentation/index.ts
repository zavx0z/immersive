/**
Определяет вид поля и подготавливает значения одного снимка Parameter.
Числовая геометрия и JSX-проекция используют один результат; Store и Document здесь не создаются.

@packageDocumentation
*/
import {metadata, metadataBoolean, metadataNumber, metadataObjectArray, metadataString, metadataStringArray} from "@zavx0z/immersive-tech-json-metadata"
import type {Zavx0zImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import type {Zavx0zImmersiveNodesProjectionParameterPresentation as Contract} from "./contract"
export type {Zavx0zImmersiveNodesProjectionParameterPresentation} from "./contract"
type NodeJsonValue = Zavx0zImmersiveTechJsonValueOwn.Input[0]
type NodeJsonObject = Extract<NodeJsonValue, Readonly<Record<string, NodeJsonValue>>>
type SelectFieldOption = NonNullable<Contract.Output["options"]>[number]
type ColorFieldValue = NonNullable<Contract.Output["color"]>
type ReferenceFieldValue = NonNullable<Contract.Output["reference"]>
type CollectionFieldProps = Readonly<{items: NonNullable<Contract.Output["collection"]>["items"]}>
type ProjectedParameterPresentation = Contract.Output

export default function resolveProjectedParameterPresentation(
  snapshot: Contract.Input,
): Contract.Output {
  const presentation = snapshot.presentation
  const valueType = snapshot.valueType?.id
  const interaction = metadataString(presentation, "interaction", "")
  const min = metadataNumber(presentation, "min")
  const max = metadataNumber(presentation, "max")
  const rawStep = metadataNumber(presentation, "step")
  const options = selectionOptions(presentation)
  const vector = numericVector(snapshot.value)
  const matrix = numericMatrix(snapshot.value)
  const color = colorValue(snapshot.value)
  const reference = referenceValue(snapshot.value)
  const collection = collectionValue(snapshot.value, presentation)

  let kind: Contract.Output["kind"] = "output"
  if ((valueType === "vector" || valueType === "rotation") && vector !== null) {
    kind = "vector"
  } else if (valueType === "matrix" && matrix !== null) {
    kind = "matrix"
  } else if (valueType === "color" && color !== null) {
    kind = "color"
  } else if (reference !== undefined || isReferenceType(valueType)) {
    kind = "reference"
  } else if (collection !== null || valueType === "collection") {
    kind = "collection"
  } else if (typeof snapshot.value === "boolean") {
    kind = interaction === "switch" ? "switch" : "checkbox"
  } else if (typeof snapshot.value === "number") {
    kind = interaction === "slider" && min !== undefined && max !== undefined ? "slider" : "number"
  } else if (typeof snapshot.value === "string") {
    const selection = options !== undefined || valueType === "menu" || valueType === "enum"
    kind = selection
      ? interaction === "cycle" ? "cycle" : interaction === "option-group" ? "option-group" : "select"
      : valueType === "path" ? "path" : "text"
  }

  return Object.freeze({
    kind,
    label: metadataString(presentation, "label", snapshot.id),
    disabled: metadataBoolean(presentation, "disabled", false),
    readOnly: metadataBoolean(presentation, "readOnly", false),
    labelHidden: metadataBoolean(presentation, "labelHidden", false),
    title: metadataString(presentation, "description", "") || undefined,
    min,
    max,
    rawStep,
    step: rawStep ?? (valueType === "integer" ? 1 : .1),
    precision: metadataNumber(presentation, "precision"),
    options,
    placeholder: metadataString(presentation, "placeholder", "") || undefined,
    axes: metadataStringArray(presentation, "axes") ??
      (valueType === "rotation" ? Object.freeze(["X", "Y", "Z"]) : undefined),
    booleanValue: typeof snapshot.value === "boolean" ? snapshot.value : false,
    numberValue: typeof snapshot.value === "number" ? snapshot.value : 0,
    stringValue: typeof snapshot.value === "string" ? snapshot.value : "",
    vector,
    matrix,
    color,
    reference,
    collection,
  })
}

function selectionOptions(value: NodeJsonValue): readonly SelectFieldOption[] | undefined {
  const candidates = metadataObjectArray(value, "options")
  if (candidates === undefined) return undefined
  return Object.freeze(candidates.flatMap((candidate, index) => {
    if (typeof candidate.value !== "string" || typeof candidate.label !== "string") return []
    return [Object.freeze({
      key: typeof candidate.key === "string" ? candidate.key : `${index}:${candidate.value}`,
      value: candidate.value,
      label: candidate.label,
      description: typeof candidate.description === "string" ? candidate.description : undefined,
      disabled: candidate.disabled === true,
      title: typeof candidate.title === "string" ? candidate.title : undefined,
    })]
  }))
}

function numericVector(value: NodeJsonValue): readonly number[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4 ||
    !value.every(entry => typeof entry === "number" && Number.isFinite(entry))) return null
  return value as readonly number[]
}

function numericMatrix(value: NodeJsonValue): readonly (readonly number[])[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4 ||
    !value.every(row => Array.isArray(row) && row.length === value.length &&
      row.every(entry => typeof entry === "number" && Number.isFinite(entry)))) return null
  return value as readonly (readonly number[])[]
}

function colorValue(value: NodeJsonValue): ColorFieldValue | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as NodeJsonObject
  if (typeof record.r !== "number" || typeof record.g !== "number" ||
    typeof record.b !== "number" || typeof record.a !== "number") return null
  return Object.freeze({r: record.r, g: record.g, b: record.b, a: record.a})
}

function referenceValue(value: NodeJsonValue): ReferenceFieldValue | null | undefined {
  if (value === null) return null
  if (typeof value !== "object" || Array.isArray(value)) return undefined
  const record = value as NodeJsonObject
  if (typeof record.id !== "string" || typeof record.label !== "string") return undefined
  return Object.freeze({
    id: record.id,
    label: record.label,
    kind: typeof record.kind === "string" ? record.kind : undefined,
  })
}

function isReferenceType(valueType: string | undefined): boolean {
  return valueType === "object" || valueType === "image" || valueType === "material" || valueType === "texture"
}

function collectionValue(
  value: NodeJsonValue,
  presentation: NodeJsonValue,
): ProjectedParameterPresentation["collection"] {
  const candidates = metadataObjectArray(presentation, "items")
  if (candidates === undefined) return null
  const items = candidates.flatMap(candidate => {
    if (typeof candidate.id !== "string" || typeof candidate.label !== "string") return []
    return [Object.freeze({
      id: candidate.id,
      label: candidate.label,
      description: typeof candidate.description === "string" ? candidate.description : undefined,
      disabled: candidate.disabled === true,
    })]
  })
  const selectedId = typeof value === "string" ? value : metadata(presentation, "selectedId")
  return Object.freeze({
    items: Object.freeze(items),
    selectedId: typeof selectedId === "string" ? selectedId : null,
    visibleRows: metadataNumber(presentation, "visibleRows"),
  })
}

/**
Одним чистым проходом выбирает готовый компонент параметра и готовит
те же данные, которые затем использует и отрисовка, и числовая геометрия.
*/
