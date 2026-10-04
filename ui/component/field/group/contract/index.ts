import type {FieldGroupDensity} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveUiComponentField} from "@zavx0z/immersive-ui-component-field/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace ImmersiveUiComponentFieldGroup {
  /**
  Входные данные FieldGroup.
  */
  interface Input extends ImmersiveUiComponentField.Input {
    readonly density?: FieldGroupDensity | undefined
  }

  /** Группа требует содержимое, размещаемое в её обычном потоке. */
  interface Slots {
    readonly default: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveUiComponentField.Output & JSX.Element<Slots>
}
