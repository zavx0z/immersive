import type {MovementUnit, Range, Snapshot} from "./types"

/** Протокол самостоятельной модели текста, выделений и истории без зависимости от DOM. */
export declare namespace UiCodeEditorModel {
  /** Начальный текст и правила хранения истории. Выделение по умолчанию находится в начале текста. */
  interface Input {
    readonly value: string
    readonly readOnly?: boolean
    readonly selections?: readonly Range[]
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
    readonly snapshot: Snapshot
    subscribe(listener: (snapshot: Snapshot) => void): () => void
    setSelections(ranges: readonly Range[], primary?: number): boolean
    addSelection(range: Range): boolean
    selectedText(separator?: string): string
    /** Без extend сначала схлопывает непустое выделение в направлении движения. */
    move(direction: "backward" | "forward", options?: Readonly<{
      unit?: MovementUnit
      extend?: boolean
    }>): boolean
    /** Перемещается по логическим строкам, сохраняя желаемую UTF-16 колонку каждой каретки. */
    moveVertical(direction: "up" | "down", options?: Readonly<{extend?: boolean}>): boolean
    insertText(text: string): boolean
    /** При равном числе строк и выделений распределяет строки; иначе вставляет весь текст в каждое выделение. */
    paste(payload: string | readonly string[]): boolean
    deleteBackward(unit?: MovementUnit): boolean
    deleteForward(unit?: MovementUnit): boolean
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
