/**
Проверка наличия содержимого слота при выполнении компонента.

Компонент использует hasSlot для проверки обязательного содержимого или
несовместимых входов, не читая children и внутренний транспорт композиции.
Результат относится к данным текущего render и обновляется вместе с ними.
Fallback не считается назначенным содержимым. Вызов не создаёт DOM, экземпляр
компонента, эффект или состояние hook.

@packageDocumentation
*/
import {composeSlot} from "../slot/index.ts"
import type {ComposeSlotInput} from "../slot/contract/input.ts"
import {readRenderingSlotContent} from "../src/runtime.ts"
import type {SlotPresenceInput} from "./contract/input.ts"
import type {SlotPresenceOutput} from "./contract/output.ts"

export type {SlotPresenceInput} from "./contract/input.ts"
export type {SlotPresenceOutput} from "./contract/output.ts"

/**
Проверяет назначенное содержимое слота без обращения к props компонента.

@param name - Точное имя принимающего slot, по умолчанию безымянный слот.
@returns Наличие содержимого по тем же правилам, которыми выбирается fallback.
@throws TypeError Имя не является строкой или слот не объявлен компонентом.
@throws HookContractError Вызов выполнен вне render компонента.
*/
export function hasSlot(name: SlotPresenceInput = ""): SlotPresenceOutput {
  if (typeof name !== "string") throw new TypeError("Slot name must be a string")
  const content = readRenderingSlotContent(name) as ComposeSlotInput["content"]
  return composeSlot({content}) !== null
}
