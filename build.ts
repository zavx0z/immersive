import {resolve} from "node:path"
import buildDistribution from "./compiler/src/distribution.ts"

/**
Полная поставка: `bun run build`; отдельный готовый компонент:
`bun run build --entry @zavx0z/immersive/ui/button/basic`.
Source workflow использует native condition `source`; producer проверяет
зависимости каждого компонента по готовым declarations без этого condition.
Выбранная сборка сохраняет остальные файлы и их прежние inventory digests.
*/
const root = import.meta.dir
const arguments_ = process.argv.slice(2)
let outdir = resolve(root, "dist")
let entry: string | undefined
for (let index = 0; index < arguments_.length; index++) {
  const value = arguments_[index]!
  if (value === "--entry") {
    entry = arguments_[++index]
    if (!entry) throw new Error("--entry requires a public specifier or source entry")
  } else if (value.startsWith("--entry=")) entry = value.slice("--entry=".length)
  else if (value.startsWith("--")) throw new Error(`Unknown build option: ${value}`)
  else outdir = resolve(value)
}
await buildDistribution(root, outdir, entry)
