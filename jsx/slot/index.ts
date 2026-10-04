/**
Домен JSX-слотов: синтаксис автора, проверка контракта и план распределения.
Серверный вход собирает инструменты компиляции. Runtime использует прямо
компоненты plan и child, не импортируя серверный API домена.

@packageDocumentation
*/
export {default as planSlots} from "@zavx0z/immersive-jsx-slot-plan"
export type {PlanSlotsInput, PlanSlotsOutput} from "@zavx0z/immersive-jsx-slot-plan"
export {default as slotChild} from "@zavx0z/immersive-jsx-slot-child"
export type {SlotChildInput, SlotChildOutput} from "@zavx0z/immersive-jsx-slot-child"
export {default as SlotAuthoring} from "@zavx0z/immersive-jsx-slot-authoring"
export type {SlotAuthoringInput, SlotAuthoringOutput} from "@zavx0z/immersive-jsx-slot-authoring"
export {default as validateSlotContracts} from "@zavx0z/immersive-jsx-slot-contract"
export type {ValidateSlotContractsInput, ValidateSlotContractsOutput} from "@zavx0z/immersive-jsx-slot-contract"
