/**
Создание модели терминального вывода.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {CreateTerminalModelInput} from "./contract/input"
import TerminalModel from "@ui/terminal-model"
import type {TerminalModelOptions} from "@ui/terminal-model"

export default function createTerminalModel(options: CreateTerminalModelInput[0] = {}): TerminalModel { return new TerminalModel(options) }

export type {CreateTerminalModelInput} from "./contract/input"
