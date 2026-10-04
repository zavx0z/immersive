/**
Сообщает причину, операцию и путь отклонённого JSON Patch.

@packageDocumentation
*/
import type {Zavx0zImmersiveTechJsonPatchError as Contract} from "./contract"
export type {Zavx0zImmersiveTechJsonPatchError} from "./contract"

export default class JsonPatchError extends Error implements Contract.Output {
  constructor(
    readonly code: Contract.Input[0],
    message: Contract.Input[1],
    readonly operationIndex: NonNullable<Contract.Input[2]> | null = null,
    readonly path: NonNullable<Contract.Input[3]> | null = null,
    options?: Contract.Input[4],
  ) {
    super(message, options)
    this.name = "JsonPatchError"
  }
}
