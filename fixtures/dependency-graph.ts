import {relative} from "node:path"
import {API, SymbolFlags} from "typescript/unstable/async"
import {type Node, SyntaxKind} from "typescript/unstable/ast"
import {
  isFunctionDeclaration,
  isIdentifier,
  isImportDeclaration,
  isJsxOpeningElement,
  isJsxSelfClosingElement,
  isNamedImports,
  isStringLiteral,
} from "typescript/unstable/ast/is"

/**
Адрес объявления компонента в исходном TSX.

@property file - Абсолютный путь к файлу с объявлением функции компонента.

@property name - Имя функции в исходном файле, а не локальный псевдоним импорта.
*/
export type ComponentReference = Readonly<{file: string, name: string}>

/**
Граф использования компонентов в JSX с ключами `путь относительно root#имя функции`.

Каждая запись содержит уникальные отсортированные списки: `uses` — ключи
непосредственно используемых компонентов, `elements` — имена нативных JSX-тегов.
Повторные использования объединяются; порядок и вложенность элементов не сохраняются.

@example
```ts
// Результат построения графа для DiagramNode.
const graph: ComponentDependencyGraph = {
  // До # — путь от корня проекта, после # — имя функции компонента.
  "nodes/node/diagram/index.tsx#DiagramNode": {
    // DiagramNode использует в своём JSX два компонента: Pane и Typography.
    uses: ["ui/component/surface/pane/index.tsx#Pane", "ui/component/typography/index.tsx#Typography"],
    // Сам DiagramNode создаёт нативный элемент <article>.
    elements: ["article"],
  },
  "ui/component/surface/pane/index.tsx#Pane": {
    // В собственном JSX Pane нет других компонентов.
    // Переданный снаружи Typography остаётся зависимостью DiagramNode.
    uses: [],
    elements: ["section"],
  },
  "ui/component/typography/index.tsx#Typography": {
    // Typography создаёт только нативный <span>.
    uses: [],
    elements: ["span"],
  },
}
```
*/
export type ComponentDependencyGraph = Record<string, {uses: string[], elements: string[]}>

/**
Рекурсивно строит граф компонентов по JSX исходных функций, не исполняя их.

Связь означает использование тега в собственном JSX функции. Компонент,
переданный через `children`, относится к автору этого JSX, а не к получателю.
Обход учитывает все ветви исходника независимо от значений props.

Поддерживаются объявления функций в том же файле, именованные и default-импорты,
включая псевдонимы. Default разрешается к имени функции у владельца, независимо
от локального имени импорта. Native TypeScript раскрывает цепочки реэкспортов
до исходного объявления функции, в том числе именованные входы Cluster.
Составные JSX-имена и компоненты через переменные не разрешаются; импорты типов пропускаются.
Повторно достигнутые компоненты не обходятся, поэтому циклы не зацикливают поиск.

Функция создаёт собственную сессию TypeScript API и закрывает её в `finally`,
включая выход с ошибкой. Исходные файлы не изменяются.

@param root - Абсолютный корень проекта: рабочий каталог TypeScript API и база ключей графа.

@param entry - Файл и исходное имя функции, с которой начинается обход.

@returns Граф всех достигнутых компонентов, включая листья без компонентных зависимостей.

@throws Если исходник или объявление не найдены, JSX-ссылка не поддерживается
либо зависимость не разрешается. Ошибки TypeScript API и разрешения модулей передаются вызывающему коду.

@example
```ts
const graph = await buildComponentDependencyGraph(root, {
  file: resolve(root, "nodes/node/diagram/index.tsx"),
  name: "DiagramNode",
})
```
*/
export async function buildComponentDependencyGraph(root: string, entry: ComponentReference): Promise<ComponentDependencyGraph> {
  const api = new API({cwd: root})
  const graph: ComponentDependencyGraph = {}
  const pending = [entry]
  const identity = (file: string, name: string) => `${relative(root, file)}#${name}`

  try {
    while (pending.length > 0) {
      const {file, name} = pending.pop()!
      const id = identity(file, name)
      if (Object.hasOwn(graph, id)) continue

      const snapshot = await api.updateSnapshot({openFiles: [file]})
      const project = await snapshot.getDefaultProjectForFile(file)
      const source = await project?.program.getSourceFile(file)
      if (project === undefined || source === undefined) throw new Error(`Не найден исходный файл компонента: ${id}`)
      const declaration = source.statements.find(statement => isFunctionDeclaration(statement) && statement.name?.text === name)
      if (declaration === undefined) throw new Error(`Не найдено объявление компонента: ${id}`)

      const imports = new Map<string, ComponentReference>()
      const resolveImportedFunction = async (name: Node): Promise<ComponentReference | undefined> => {
        let symbol = await project.checker.getSymbolAtLocation(name)
        const visited = new Set<number>()
        while (symbol && (symbol.flags & SymbolFlags.Alias) !== 0) {
          if (visited.has(symbol.id)) throw new Error("Цикл псевдонимов компонента")
          visited.add(symbol.id)
          symbol = await project.checker.getAliasedSymbol(symbol)
        }
        if (!symbol) return undefined
        for (const handle of symbol.declarations) {
          const ownerProject = await snapshot.getDefaultProjectForFile(handle.path) ?? project
          const declaration = await handle.resolve(ownerProject)
          if (declaration && isFunctionDeclaration(declaration) && declaration.name) {
            return {file: declaration.getSourceFile().fileName, name: declaration.name.text}
          }
        }
        return undefined
      }
      for (const statement of source.statements) {
        if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier)) continue
        const clause = statement.importClause
        if (clause === undefined || clause.phaseModifier === SyntaxKind.TypeKeyword) continue
        if (clause.name) {
          const declaration = await resolveImportedFunction(clause.name)
          if (declaration) imports.set(clause.name.text, declaration)
        }
        const bindings = clause.namedBindings
        if (bindings === undefined || !isNamedImports(bindings)) continue
        for (const binding of bindings.elements) {
          if (binding.isTypeOnly) continue
          const declaration = await resolveImportedFunction(binding.name)
          if (declaration) imports.set(binding.name.text, declaration)
        }
      }

      const uses = new Set<string>()
      const elements = new Set<string>()
      const visit = (node: Node) => {
        if (isJsxOpeningElement(node) || isJsxSelfClosingElement(node)) {
          if (!isIdentifier(node.tagName)) throw new Error(`Неподдерживаемая форма ссылки на JSX-компонент в ${id}`)
          const tag = node.tagName.text
          if (/^[a-z]/.test(tag)) {
            if (tag !== "slot") elements.add(tag)
          } else {
            const local = source.statements.some(statement => isFunctionDeclaration(statement) && statement.name?.text === tag)
            const dependency = imports.get(tag) ?? (local ? {file, name: tag} : undefined)
            if (dependency === undefined) throw new Error(`Не удалось разрешить JSX-компонент ${tag} в ${id}`)
            uses.add(identity(dependency.file, dependency.name))
            pending.push(dependency)
          }
        }
        node.forEachChild(visit)
      }
      visit(declaration)
      graph[id] = {uses: [...uses].sort(), elements: [...elements].sort()}
    }

    return graph
  } finally {
    await api.close()
  }
}
