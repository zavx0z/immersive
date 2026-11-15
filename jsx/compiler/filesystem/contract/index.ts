import type {FileSystem} from "typescript/unstable/fs"

/** Чтение исходного проекта TypeScript с настройками одного потребителя. */
export declare namespace ImmersiveJsxCompilerFilesystem {
  /**
  Независимые настройки файлового представления.

  @property customConditions - Условия разрешения exports. undefined сохраняет исходную конфигурацию; пустой массив отключает дополнительные условия.

  @property [sourceFiles] - Непустой набор абсолютных путей корневых файлов этой компиляции. Его импорты разрешает штатный TypeScript.

  @property [sourceTexts] - Тексты изменённых файлов по их точным путям, доступные только этому представлению.
  */
  type Input = readonly [
    customConditions: readonly string[] | undefined,
    sourceFiles?: readonly string[],
    sourceTexts?: ReadonlyMap<string, string>,
  ]

  /** Адаптер native TypeScript API либо undefined, если все настройки отсутствуют. */
  type Output = FileSystem | undefined
}
