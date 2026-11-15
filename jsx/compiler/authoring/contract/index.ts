import type {FunctionDeclaration, SourceFile} from "typescript/unstable/ast"

/** Описание авторских объявлений одного исходного модуля. */
export declare namespace ImmersiveJsxCompilerAuthoring {
  /** AST исходного файла из действующей TypeScript-сессии. */
  type Input = readonly [source: SourceFile]

  /**
  Объявления из того же AST, сгруппированные по способу компиляции.

  @property components - Именованные функции с заглавной буквы и единственным завершающим JSX return.

  @property hooks - Именованные функции с префиксом use и следующей заглавной буквой или цифрой.

  @property authoringImports - Исполняемые импорты поддерживаемой авторской среды. Чисто типовые импорты исключены.
  */
  type Output = Readonly<{
    components: readonly FunctionDeclaration[]
    hooks: readonly FunctionDeclaration[]
    authoringImports: readonly string[]
  }>
}
