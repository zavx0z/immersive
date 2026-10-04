/**
Серверный публичный API области JSX: компиляция, подключение Bun и контракты автора.
Домен назначает имена реализациям; внутренние пакеты импортируют владельцев напрямую.
Область slot объединяет авторство и обработку слотов. Native automatic JSX
получает свои обязательные входы из доменов runtime и development.

@packageDocumentation
*/
export {JsxCompilerSession, createJsxBunPlugin, JsxCompileError} from "@zavx0z/immersive-jsx-compiler"
export type {
  JsxCompilerSessionOptions, JsxCompileResult, CreateJsxPluginOptions,
  JsxPlugin, JsxErrorInput, JsxErrorOutput,
} from "@zavx0z/immersive-jsx-compiler"
export {default as jsxEventNames} from "@zavx0z/immersive-jsx-event"
export type {JsxEventName, EventNamesOutput} from "@zavx0z/immersive-jsx-event"
export {planSlots, slotChild, SlotAuthoring, validateSlotContracts} from "@zavx0z/immersive-jsx-slot"
export type {
  PlanSlotsInput, PlanSlotsOutput, SlotChildInput, SlotChildOutput,
  SlotAuthoringInput, SlotAuthoringOutput, ValidateSlotContractsInput, ValidateSlotContractsOutput,
} from "@zavx0z/immersive-jsx-slot"
export type {JSX} from "@zavx0z/immersive-jsx-compiler"
