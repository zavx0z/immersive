type Code =
  | "invalid_patch"
  | "invalid_json"
  | "invalid_pointer"
  | "invalid_array_index"
  | "path_not_found"
  | "test_failed"
  | "limit_exceeded"

/** Типизированная ошибка отказа с точным индексом операции и путём. */
export declare namespace Zavx0zImmersiveTechJsonPatchError {
  type Input = readonly [code: Code, message: string, operationIndex?: number | null, path?: string | null, options?: ErrorOptions]
  interface Output extends Error {
    readonly code: Code
    readonly operationIndex: number | null
    readonly path: string | null
  }
}
