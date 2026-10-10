import {existsSync} from "node:fs"
import {dirname, resolve} from "node:path"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"

const registered = new Set<string>()

export function repositoryRoot(directory: string): string {
  let current = resolve(directory)
  while (!existsSync(resolve(current, ".git"))) {
    const parent = dirname(current)
    if (parent === current) return resolve(directory)
    current = parent
  }
  return current
}

/**
Подключает JSX compiler ко всем последующим импортам TSX внутри проекта.

Preload вызывает регистрацию до загрузки статического графа теста; `createHeadless`
повторяет её идемпотентно для программных вызовов. Production TSX и сценарии
обрабатываются одинаково. Тем же compiler обрабатываются JSX expressions в spec/test: результатом служат
готовые DOM constructors и инертные construction records.
Штатный persistent plugin сохраняет одну сессию и кэш компилятора на корень
в пределах тестового процесса; последовательность преобразований принадлежит JSX.
*/
export function registerHeadlessCompiler(projectRoot: string): void {
  const root = resolve(projectRoot)
  if (registered.has(root)) return
  const session = new JsxCompilerSession({cwd: root, sourceRoots: [root]})
  Bun.plugin(createJsxBunPlugin({cwd: root, sourceRoots: [root], persistent: true, session}))
  registered.add(root)
}
