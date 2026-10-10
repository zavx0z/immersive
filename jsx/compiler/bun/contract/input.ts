import type JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"
import type {JsxCompileResult} from "@zavx0z/immersive-jsx-compiler-session"

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
  customConditions?: readonly string[]
  sourceFiles?: readonly string[]
  /** Преобразование governed текста перед native JSX lowering; исходный файл не записывается. */
  sourceTransform?: (path: string, source: string) => string | Promise<string>
  /** Наблюдение результата и позиций относительно effective входного текста. */
  onCompiled?: (path: string, source: string, result: JsxCompileResult) => void | Promise<void>
}>
