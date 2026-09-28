import {resolve} from "node:path"
import {createJsxBunPlugin} from "@jsx/bun"

// Все тесты владельца используют один compiler с полным графом JSX-зависимостей.
const root = resolve(import.meta.dir, "../../..")
Bun.plugin(createJsxBunPlugin({
  cwd: root,
  persistent: true,
  sourceRoots: ["nodes", "ui", "markdown"].map(directory => resolve(root, directory)),
}))
