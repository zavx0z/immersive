import type {TerminalQueryMode, TerminalSnapshot} from "./types"

/** Протокол модели терминального вывода без процесса, DOM или собственных устройств ввода. */
export declare namespace ImmersiveTechTerminal {
  /** Хранение строк и передача служебных ответов принимающему владельцу. */
  interface Input {
    /** Положительное целое число строк, по умолчанию 40. */
    readonly maxLines?: number
    readonly queryMode?: TerminalQueryMode
    readonly onReply?: (data: string) => void
  }

  /** Декодирование потока, неизменяемый снимок и управляемая подписка. */
  interface Output {
    readonly snapshot: TerminalSnapshot
    subscribe(listener: () => void): () => void
    setQueryMode(mode: TerminalQueryMode): void
    /** Текст без управляющих последовательностей, хвостовых пробелов и завершающих пустых строк. */
    toText(): string
    writeln(line?: string): void
    /** Сбрасывает строки, позицию, оформление и состояние потокового декодера. */
    clear(): void
    /** Принимает текст либо очередной фрагмент UTF-8; неполная последовательность сохраняется между вызовами. */
    write(data: string | Uint8Array): void
  }
}
