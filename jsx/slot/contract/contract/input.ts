import type {SourceFile} from "typescript/unstable/ast"
import type {Project} from "typescript/unstable/async"

/**
Подготовленный нативным TypeScript проект и принадлежащий ему JSX-исходник.

@property sourceFile - AST проверяемого файла того же snapshot, что и project.
Исходный текст и объявления типов не переписываются.

@property project - Владелец checker и разрешённых им объявлений.
Вызвавший код сохраняет snapshot до завершения проверки и освобождает его сам.
*/
export interface ValidateSlotContractsInput {
  readonly sourceFile: SourceFile
  readonly project: Project
}
