import type {FieldGroupDensity} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {Zavx0zImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace Zavx0zImmersiveUiComponentFieldGroup {
  /**
  Входные данные FieldGroup.
  */
  interface Input extends Zavx0zImmersiveUiComponentField.Input {
    readonly density?: FieldGroupDensity | undefined
  }

  /** Группа требует содержимое, размещаемое в её обычном потоке. */
  interface Slots {
    readonly default: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = Zavx0zImmersiveUiComponentField.Output & JSX.Element<Slots>
}
