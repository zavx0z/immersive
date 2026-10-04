import type {Zavx0zImmersiveUiComponentFieldReference} from "../contract/index"
type ReferenceFieldProps = Zavx0zImmersiveUiComponentFieldReference.Input

/** Частная подготовка поле интерфейса: ссылка на ресурс. */
export function validateReferenceField(props: ReferenceFieldProps): void {
  if (props.value !== null) {
    if (typeof props.value.id !== "string" || props.value.id.length === 0) throw new TypeError("ReferenceField value id must not be empty")
    if (typeof props.value.label !== "string") throw new TypeError("ReferenceField value label must be a string")
  }
  const density = props.density ?? "regular"
  if (density !== "regular" && density !== "compact") throw new Error(`Unknown ReferenceField density: ${density}`)
}
