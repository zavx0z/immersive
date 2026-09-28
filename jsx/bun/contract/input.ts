import type {JsxCompilerSession} from "@jsx/compiler"

/**
Подключение JSX к штатному циклу сборки Bun.

@property sourceRoots - Непустой список файлов или директорий авторского JSX.

@property cwd - База относительных корней и поиска TypeScript project.

@property capabilityManifestPath - Файл usage manifest, записываемый только после успешной сборки.

@property persistent - Сохраняет сессию между сборками; тогда её закрывает вызывающая интеграция.

@property session - Общая сессия компиляции и проверки авторства у интеграции.

@property styleSourceRootIds - Публичные идентификаторы корней для происхождения авторского CSS.
*/
export type CreateJsxPluginOptions = Readonly<{
  cwd?: string
  capabilityManifestPath?: string
  persistent?: boolean
  session?: JsxCompilerSession
  sourceRoots: readonly string[]
  styleSourceRootIds?: readonly string[]
}>
