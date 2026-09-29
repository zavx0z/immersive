/**
Домен JSX-слотов: синтаксис автора, проверка контракта и план распределения.
Серверный вход собирает инструменты компиляции. Runtime использует прямо
компоненты plan и child, не импортируя серверный API домена.

@packageDocumentation
*/
export {default as planSlots} from "@jsx-slot/plan"
export type {PlanSlotsInput, PlanSlotsOutput} from "@jsx-slot/plan"
export {default as slotChild} from "@jsx-slot/child"
export type {SlotChildInput, SlotChildOutput} from "@jsx-slot/child"
export {default as SlotAuthoring} from "@jsx-slot/authoring"
export type {SlotAuthoringInput, SlotAuthoringOutput} from "@jsx-slot/authoring"
export {default as validateSlotContracts} from "@jsx-slot/contract"
export type {ValidateSlotContractsInput, ValidateSlotContractsOutput} from "@jsx-slot/contract"
