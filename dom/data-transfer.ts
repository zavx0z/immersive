const sealTransfer = Symbol("seal-clipboard-data-transfer")
const releaseTransfer = Symbol("release-data-transfer")

/** Доступный во время события список native File; item и индексы только для чтения. */
export class FileList implements Iterable<File> {
  readonly [index: number]: File
  private entries: File[]

  constructor(files: readonly File[] = []) {
    this.entries = [...files]
    for (let index = 0; index < files.length; index++) {
      Object.defineProperty(this, index, {enumerable: true, get: () => this.entries[index]})
    }
  }

  get length(): number { return this.entries.length }
  item(index: number): File | null { return this.entries[index] ?? null }
  *[Symbol.iterator](): IterableIterator<File> {
    for (let index = 0; index < this.entries.length; index++) yield this.entries[index]!
  }
  [releaseTransfer](): void { this.entries = [] }
}

export type DataTransferDropEffect = "none" | "copy" | "link" | "move"
export type DataTransferEffectAllowed = "none" | "copy" | "copyLink" | "copyMove" | "link" | "linkMove" | "move" | "all" | "uninitialized"
export type DataTransferInit = Readonly<{
  files?: readonly File[]
  types?: readonly string[]
  dropEffect?: DataTransferDropEffect
  effectAllowed?: DataTransferEffectAllowed
}>

/** Строки clipboard и доступные в текущем drag-событии native файлы. */
export class DataTransfer {
  private readonly strings = new Map<string, string>()
  private writable = true
  private availableTypes: readonly string[]
  private currentDropEffect: DataTransferDropEffect
  private currentEffectAllowed: DataTransferEffectAllowed
  private readonly fileList: FileList

  constructor(init: DataTransferInit = {}) {
    this.fileList = new FileList(init.files)
    this.availableTypes = [...(init.types ?? [])]
    this.currentDropEffect = init.dropEffect ?? "none"
    this.currentEffectAllowed = init.effectAllowed ?? "uninitialized"
  }

  get files(): FileList { return this.fileList }

  get types(): readonly string[] {
    return Object.freeze([...new Set([...this.availableTypes, ...this.strings.keys(), ...(this.files.length > 0 ? ["Files"] : [])])])
  }

  get dropEffect(): DataTransferDropEffect { return this.currentDropEffect }
  set dropEffect(value: DataTransferDropEffect) {
    if (["none", "copy", "link", "move"].includes(value)) this.currentDropEffect = value
  }
  get effectAllowed(): DataTransferEffectAllowed { return this.currentEffectAllowed }
  set effectAllowed(value: DataTransferEffectAllowed) {
    if (this.writable && ["none", "copy", "copyLink", "copyMove", "link", "linkMove", "move", "all", "uninitialized"].includes(value)) {
      this.currentEffectAllowed = value
    }
  }

  getData(format: string): string {
    const key = normalizeFormat(format)
    const value = this.strings.get(key) ?? ""
    if (String(format).toLowerCase() !== "url") return value
    return value.split(/\r?\n/).find(line => line.length > 0 && !line.startsWith("#")) ?? ""
  }

  setData(format: string, data: string): void {
    if (this.writable) this.strings.set(normalizeFormat(format), String(data))
  }

  clearData(format?: string): void {
    if (!this.writable) return
    if (format === undefined) this.strings.clear()
    else this.strings.delete(normalizeFormat(format))
  }

  [sealTransfer](): void { this.writable = false }
  [releaseTransfer](): void {
    this.writable = false
    this.strings.clear()
    this.availableTypes = []
    this.files[releaseTransfer]()
  }
}

/** Browser-owned incoming clipboard payload becomes read-only before event dispatch. */
export function sealDataTransfer(transfer: DataTransfer): DataTransfer {
  transfer[sealTransfer]()
  return transfer
}

/** Browser завершает доступ к payload после синхронной доставки native события. */
export function releaseDataTransfer(transfer: DataTransfer): void {
  transfer[releaseTransfer]()
}

function normalizeFormat(format: string): string {
  const normalized = String(format).toLowerCase()
  return normalized === "text" ? "text/plain" : normalized === "url" ? "text/uri-list" : normalized
}
