/**
Конфигурация одной сессии семантической компиляции JSX.

@property cwd - Рабочая директория TypeScript API для поиска конфигурации проекта.

@property sourceRoots - Непустой список файлов или директорий, которым разрешена
компиляция JSX. Контракты типов могут импортироваться из других директорий:
их изменения учитываются как семантические зависимости, без разрешения компиляции их кода.

@property styleSourceRootIds - Необязательные публичные идентификаторы корней
для происхождения CSS. Число идентификаторов совпадает с sourceRoots.
*/
export type JsxCompilerSessionOptions = Readonly<{
  cwd: string
  sourceRoots: readonly string[]
  styleSourceRootIds?: readonly string[]
  /** Native package exports conditions для отдельной сборки; исходные tsconfig не изменяются. */
  customConditions?: readonly string[]
  /** Точные owned root files отдельной сборки; зависимости читаются штатным resolver через imports. */
  sourceFiles?: readonly string[]
}>
