/** Полный набор уже подготовленных входов одного кадра; порядок частей значим. */
export type FrameInputs = Readonly<{
  references: readonly unknown[]
  data: readonly ArrayBufferView[]
}>

/**
 * Сравнивает входы с последним успешно представленным кадром без хеширования.
 *
 * commit вызывается владельцем только после успешной обычной отрисовки.
 * Буферы копируются с учётом byteOffset; matches никогда не публикует кандидата.
 * Входы должны оставаться неизменными на протяжении синхронного вызова.
 */
export class FrameInputState {
  readonly #references: unknown[] = []
  readonly #storage: Uint8Array[] = []
  readonly #lengths: number[] = []
  #valid = false

  matches(input: FrameInputs): boolean {
    if (!this.#valid || input.references.length !== this.#references.length || input.data.length !== this.#lengths.length) return false
    for (let index = 0; index < this.#references.length; index++) {
      if (!Object.is(input.references[index], this.#references[index])) return false
    }
    for (let index = 0; index < input.data.length; index++) {
      const view = input.data[index]!
      if (view.byteLength !== this.#lengths[index]) return false
      const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
      const previous = this.#storage[index]!
      for (let offset = 0; offset < bytes.length; offset++) if (bytes[offset] !== previous[offset]) return false
    }
    return true
  }

  commit(input: FrameInputs): void {
    // Проверка всех view и чтение references предшествуют изменению baseline.
    const references = Array.from(input.references)
    const sources = input.data.map(view => new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
    for (let index = 0; index < sources.length; index++) {
      const source = sources[index]!
      let storage = this.#storage[index]
      if (storage === undefined || storage.length < source.length) {
        let capacity = Math.max(1, storage?.length ?? 0)
        while (capacity < source.length) capacity *= 2
        storage = new Uint8Array(capacity)
        this.#storage[index] = storage
      }
      storage.set(source)
      this.#lengths[index] = source.length
    }
    this.#lengths.length = sources.length
    this.#references.length = references.length
    for (let index = 0; index < references.length; index++) this.#references[index] = references[index]
    this.#valid = true
  }

  /** Снимает право на replay; выделенная ёмкость CPU-буферов остаётся для reuse. */
  invalidate(releaseMemory = false): void {
    this.#valid = false
    this.#references.length = 0
    this.#lengths.length = 0
    if (releaseMemory) this.#storage.length = 0
  }
}
