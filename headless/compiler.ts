import {existsSync} from "node:fs"
import {dirname, relative, resolve, sep} from "node:path"
import {createTemplateJsxBunPlugin} from "@zavx0z/template/bun"
import {JsxCompilerSession} from "@zavx0z/template/compiler"

const registered = new Set<string>()

export function repositoryRoot(directory: string): string {
  let current = resolve(directory)
  while (!existsSync(resolve(current, ".git"))) {
    const parent = dirname(current)
    if (parent === current) throw new Error("Для Headless нужно явно указать projectRoot")
    current = parent
  }
  return current
}

/**
Подключает обычный Template compiler ко всем последующим импортам TSX внутри проекта.

Preload вызывает регистрацию до загрузки статического графа теста; `createHeadless`
повторяет её идемпотентно для программных вызовов. Production TSX компилируется
Template compiler, а JSX в spec/test автоматически использует инертный Headless transport.
Штатный persistent plugin сохраняет одну сессию и кэш компилятора на корень
в пределах тестового процесса; последовательность преобразований принадлежит Template.
*/
export function registerHeadlessCompiler(projectRoot: string): void {
  const root = resolve(projectRoot)
  if (registered.has(root)) return
  const session = new JsxCompilerSession({cwd: root, sourceRoots: [root]})
  Bun.plugin({
    name: `headless-template:${root}`,
    setup(builder) {
      builder.onLoad({filter: /\.(?:spec|test)\.tsx$/}, async ({path}) => {
        const local = relative(root, path)
        if (local.startsWith(`..${sep}`) || local === ".." || local.split(sep).includes("node_modules")) return undefined
        const contents = await session.prepareSlotAuthoringFile(path, "@immersive/headless/jsx-runtime")
        return {
          contents: `/** @jsxImportSource @immersive/headless */\n${contents}`,
          loader: "tsx",
        }
      })
      createTemplateJsxBunPlugin({cwd: root, sourceRoots: [root], persistent: true, session}).setup(builder)
    },
  })
  registered.add(root)
}
