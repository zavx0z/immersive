import {existsSync} from "node:fs"
import {dirname, relative, resolve, sep} from "node:path"
import createJsxBunPlugin from "@immersive-jsx-compiler/bun"
import JsxCompilerSession from "@immersive-jsx-compiler/session"

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
Подключает JSX compiler ко всем последующим импортам TSX внутри проекта.

Preload вызывает регистрацию до загрузки статического графа теста; `createHeadless`
повторяет её идемпотентно для программных вызовов. Production TSX компилируется
JSX compiler, а JSX в spec/test использует общий automatic JSX protocol.
Штатный persistent plugin сохраняет одну сессию и кэш компилятора на корень
в пределах тестового процесса; последовательность преобразований принадлежит JSX.
*/
export function registerHeadlessCompiler(projectRoot: string): void {
  const root = resolve(projectRoot)
  if (registered.has(root)) return
  const session = new JsxCompilerSession({cwd: root, sourceRoots: [root]})
  Bun.plugin({
    name: `headless-jsx:${root}`,
    setup(builder) {
      builder.onLoad({filter: /\.(?:spec|test)\.tsx$/}, async ({path}) => {
        const local = relative(root, path)
        if (local.startsWith(`..${sep}`) || local === ".." || local.split(sep).includes("node_modules")) return undefined
        const contents = await session.prepareSlotAuthoringFile(path, Bun.resolveSync("@immersive-jsx-slot/child", import.meta.dir))
        return {
          contents: `/** @jsxImportSource @immersive/jsx */\n${contents}`,
          loader: "tsx",
        }
      })
      createJsxBunPlugin({cwd: root, sourceRoots: [root], persistent: true, session}).setup(builder)
    },
  })
  registered.add(root)
}
