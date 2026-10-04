/**
Домен JSX-слотов: синтаксис автора, проверка контракта и план распределения.
Серверный вход собирает инструменты компиляции. Runtime использует прямо
компоненты plan и child, не импортируя серверный API домена.

@packageDocumentation
*/
export {default as planSlots} from "@immersive-jsx-slot/plan"
export type {PlanSlotsInput, PlanSlotsOutput} from "@immersive-jsx-slot/plan"
export {default as slotChild} from "@immersive-jsx-slot/child"
export type {SlotChildInput, SlotChildOutput} from "@immersive-jsx-slot/child"
export {default as SlotAuthoring} from "@immersive-jsx-slot/authoring"
export type {SlotAuthoringInput, SlotAuthoringOutput} from "@immersive-jsx-slot/authoring"
export {default as validateSlotContracts} from "@immersive-jsx-slot/contract"
export type {ValidateSlotContractsInput, ValidateSlotContractsOutput} from "@immersive-jsx-slot/contract"
