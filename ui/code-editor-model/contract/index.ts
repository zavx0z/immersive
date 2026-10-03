import type {CodeEditorMovementUnit, CodeEditorRange, CodeEditorSnapshot} from "./types"

/** Протокол самостоятельной модели текста, выделений и истории без зависимости от DOM. */
export declare namespace UiCodeEditorModel {
  /** Начальный текст и правила хранения истории. Выделение по умолчанию находится в начале текста. */
  interface Input {
    readonly value: string
    readonly readOnly?: boolean
    readonly selections?: readonly CodeEditorRange[]
    readonly primary?: number
    /** Неотрицательное целое; по умолчанию 100, ноль отключает накопление undo. */
    readonly historyLimit?: number
  }

  /**
  Текущий снимок и операции над одним владельцем текста.
  Изменяющие методы возвращают признак изменения; подписка получает последующие
  снимки без начальной отправки. Возвращённая отписка освобождает наблюдателя.
  */
  interface Output {
    readonly snapshot: CodeEditorSnapshot
    subscribe(listener: (snapshot: CodeEditorSnapshot) => void): () => void
    setSelections(ranges: readonly CodeEditorRange[], primary?: number): boolean
    addSelection(range: CodeEditorRange): boolean
    selectedText(separator?: string): string
    /** Без extend сначала схлопывает непустое выделение в направлении движения. */
    move(direction: "backward" | "forward", options?: Readonly<{
      unit?: CodeEditorMovementUnit
      extend?: boolean
    }>): boolean
    /** Перемещается по логическим строкам, сохраняя желаемую UTF-16 колонку каждой каретки. */
    moveVertical(direction: "up" | "down", options?: Readonly<{extend?: boolean}>): boolean
    insertText(text: string): boolean
    /** При равном числе строк и выделений распределяет строки; иначе вставляет весь текст в каждое выделение. */
    paste(payload: string | readonly string[]): boolean
    deleteBackward(unit?: CodeEditorMovementUnit): boolean
    deleteForward(unit?: CodeEditorMovementUnit): boolean
    undo(): boolean
    redo(): boolean
    setReadOnly(readOnly: boolean): boolean
    /** Внешняя замена отменяет композицию и очищает историю; выделения сбрасываются либо отображаются на новый текст. */
    replaceValue(value: string, options: Readonly<{selection: "reset" | "map"}>): boolean
    beginComposition(): boolean
    updateComposition(text: string): boolean
    /** Коммит одной IME-композиции образует один шаг undo. */
    commitComposition(text?: string): boolean
    cancelComposition(): boolean
  }
}
