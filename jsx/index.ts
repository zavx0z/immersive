/**
Серверный публичный API области JSX: компиляция, подключение Bun и контракты автора.
Домен назначает имена реализациям; внутренние пакеты импортируют владельцев напрямую.
Область slot объединяет авторство и обработку слотов. Native automatic JSX
получает свои обязательные входы из доменов runtime и development.

@packageDocumentation
*/
export {JsxCompilerSession, createJsxBunPlugin, JsxCompileError} from "@jsx/compiler"
export type {
  JsxCompilerSessionOptions, JsxCompileResult, CreateJsxPluginOptions,
  JsxPlugin, JsxErrorInput, JsxErrorOutput,
} from "@jsx/compiler"
export {default as jsxEventNames} from "@jsx/events"
export type {JsxEventName, EventNamesOutput} from "@jsx/events"
export {planSlots, slotChild, SlotAuthoring, validateSlotContracts} from "@jsx/slot"
export type {
  PlanSlotsInput, PlanSlotsOutput, SlotChildInput, SlotChildOutput,
  SlotAuthoringInput, SlotAuthoringOutput, ValidateSlotContractsInput, ValidateSlotContractsOutput,
} from "@jsx/slot"
export type {JSX} from "@jsx/compiler"
