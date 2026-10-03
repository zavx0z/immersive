import type {FieldGroupDensity} from "./types.ts"

import type {JSX} from "@jsx-compiler/session"
import type {UiFields} from "@ui/fields/contract"

/** Собственный протокол поля и общие гарантии его группы. */
export declare namespace UiFieldsFieldGroup {
  /**
  Входные данные FieldGroup.
  */
  interface Input extends UiFields.Input {
    readonly density?: FieldGroupDensity | undefined
  }

  /** Группа требует содержимое, размещаемое в её обычном потоке. */
  interface Slots {
    readonly default: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = UiFields.Output & JSX.Element<Slots>
}
