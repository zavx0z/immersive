/**
Компиляция авторского TSX в шаблоны с адресованными DOM- и CSS-привязками.

Авторское содержимое размещается через slot. Первый параметр компонента может
быть объектом props или его деструктуризацией; переименование style сохраняет
его транспорт. Связь определяется символами TypeScript, вложенные объекты и
rest не заменяют прямую привязку. Прежний children receiver остаётся внутренней
совместимостью для ещё не мигрированных внешних потребителей.

Создание Document, состояние компонентов и кадр принадлежат runtime-владельцам.

@packageDocumentation
*/
export {JsxCompileError} from "./errors.ts"
export {JsxCompilerSession} from "./session.ts"
export type {
  JsxCompileResult,
  JsxCompilerSessionOptions,
  JsxCompilerStats,
} from "./session.ts"
export type {
  CapabilityUsage,
  CapabilityUsagePosition,
  CapabilityUsageSource,
  CapabilityUsageValue,
  CssAttributeSelectorCapabilityUsage,
  CssPropertyCapabilityUsage,
  CssPseudoCapabilityUsage,
  DomMemberCapabilityUsage,
  EventCapabilityUsage,
  IntrinsicAttributeCapabilityUsage,
  IntrinsicElementCapabilityUsage,
  RefCapabilityUsage,
} from "./capability-usage.ts"
export {
  CAPABILITY_USAGE_GENERATOR_VERSION,
  CAPABILITY_USAGE_SCHEMA_VERSION,
  createCapabilityUsageManifest,
  serializeCapabilityUsageManifest,
} from "./capability-manifest.ts"
export type {
  CapabilityUsageFile,
  CapabilityUsageManifest,
} from "./capability-manifest.ts"
export {jsxAuthoringProfile, transformJsxSourceFile} from "./transform.ts"
export type {JsxTransformOptions, JsxTransformSymbols} from "./transform.ts"
