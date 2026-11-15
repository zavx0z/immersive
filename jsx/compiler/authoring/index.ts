/**
Профиль объявлений авторского JSX-модуля.
Находит компоненты, пользовательские hooks и исполняемые импорты авторской среды,
чтобы преобразование кода и выпуск деклараций использовали одну классификацию.

Исполняется сборщиком в Bun и использует AST/API TypeScript той же сессии.

@packageDocumentation
*/
import type {FunctionDeclaration} from "typescript/unstable/ast"
import type {ImmersiveJsxCompilerAuthoring as Contract} from "./contract"
export type {ImmersiveJsxCompilerAuthoring} from "./contract"
import componentReturn from "@zavx0z/immersive-jsx-compiler-authoring-return"
import {SyntaxKind} from "typescript/unstable/ast"
import {isFunctionDeclaration, isImportDeclaration, isNamedImports, isStringLiteral} from "typescript/unstable/ast/is"

const authoringModules = new Set([
  "@zavx0z/immersive-component", "@zavx0z/immersive-component/authoring",
  "@zavx0z/immersive-component/slot", "@zavx0z/immersive-component/slot-presence",
  "@zavx0z/immersive-browser/authoring", "@zavx0z/immersive/XReact",
  "@zavx0z/immersive/XReact/browser", "@zavx0z/immersive/XReact/slot", "@zavx0z/immersive/XReact/slot-presence",
])

/** Одна классификация исходных деклараций для emit и генератора public types. */
export default function getAuthoringDeclarations(source: Contract.Input[0]): Contract.Output {
  const functions = source.statements.filter((statement): statement is FunctionDeclaration => isFunctionDeclaration(statement) && statement.name !== undefined)
  return {
    components: functions.filter(declaration => /^[A-Z]/.test(declaration.name!.text) && componentReturn(declaration) !== null),
    hooks: functions.filter(declaration => /^use[A-Z0-9]/.test(declaration.name!.text)),
    authoringImports: source.statements.flatMap(statement => isImportDeclaration(statement) &&
      isStringLiteral(statement.moduleSpecifier) && authoringModules.has(statement.moduleSpecifier.text) &&
      statement.importClause?.phaseModifier !== SyntaxKind.TypeKeyword &&
      !(statement.importClause?.namedBindings && isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.every(binding => binding.isTypeOnly))
      ? [statement.moduleSpecifier.text] : []),
  }
}
