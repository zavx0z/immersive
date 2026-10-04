import type {CollectionFieldDensity} from "./types.ts"
import type {CollectionFieldItem} from "./types.ts"
import type {CollectionFieldMoveDirection} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Zavx0zImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace Zavx0zImmersiveUiComponentFieldCollection {
  /**
  Входные данные CollectionField.
  */
  interface Input extends Zavx0zImmersiveUiComponentField.Input {
    readonly items: readonly CollectionFieldItem[]
    readonly selectedId: string | null
    readonly visibleRows?: number | undefined
    readonly emptyLabel?: string | undefined
    readonly density?: CollectionFieldDensity | undefined
    readonly disabled?: boolean | undefined
    readonly readOnly?: boolean | undefined
    readonly onSelect?: ((id: string, event: Event) => void) | undefined
    readonly onAdd?: ((event: Event) => void) | undefined
    readonly onRemove?: ((id: string, event: Event) => void) | undefined
    readonly onMove?: ((id: string, direction: CollectionFieldMoveDirection, event: Event) => void) | undefined
  }

  type Output = Zavx0zImmersiveUiComponentField.Output & JSX.Element
}
