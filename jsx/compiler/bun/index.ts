/** Bun-интеграция сессии JSX: компиляция, жизненный цикл и usage manifest.

@packageDocumentation
*/
import {mkdir, writeFile} from "node:fs/promises"
import {dirname, extname, resolve} from "node:path"
import {discoverSourceFiles, commonCwd, sourceLoader} from "./src/files.ts"
import type {JsxPlugin} from "./contract/output.ts"
import JsxCompilerSession from "@jsx-compiler/session"
import {
  createCapabilityUsageManifest,
  serializeCapabilityUsageManifest,
} from "./src/capability-manifest.ts"
import type {JsxCompileResult} from "@jsx-compiler/session"
type CapabilityUsage = JsxCompileResult["capabilityUsages"][number]

import type {CreateJsxPluginOptions} from "./contract/input.ts"
export type {CreateJsxPluginOptions} from "./contract/input.ts"
export type {JsxPlugin} from "./contract/output.ts"

/**
Подключает общий JSX compiler к штатным callbacks Bun.

Предупреждения выводятся через console.warn один раз на компонент за жизнь
плагина; cache hit не повторяет сообщение. Ошибки явного контракта останавливают
сборку. Неперсистентная сессия закрывается в onEnd, в том числе при ошибке.
*/
export default function createJsxBunPlugin(
  options: CreateJsxPluginOptions,
): JsxPlugin {
  const configuredCwd = resolve(options.cwd ?? process.cwd())
  if (options.capabilityManifestPath !== undefined &&
    options.capabilityManifestPath.trim() === "") {
    throw new TypeError("capabilityManifestPath requires a non-empty path")
  }
  const capabilityManifestPath = options.capabilityManifestPath === undefined
    ? null
    : resolve(configuredCwd, options.capabilityManifestPath)
  const roots = options.sourceRoots.map((root) => resolve(configuredCwd, root))
  if (roots.length === 0) throw new TypeError("JSX plugin requires at least one source root")
  const session = options.session ?? new JsxCompilerSession({
    cwd: options.cwd === undefined ? commonCwd(roots) : configuredCwd,
    sourceRoots: roots,
    ...(options.styleSourceRootIds === undefined
      ? {}
      : {styleSourceRootIds: options.styleSourceRootIds}),
  })
  const capabilityUsages = new Map<string, readonly CapabilityUsage[]>()
  const reported = new WeakSet<JsxCompileResult>()
  const diagnosticKeys = new Set<string>()
  let refresh = Promise.resolve()
  return {
    name: "zavx0z-jsx",
    setup(builder) {
      const hasBuildLifecycle = typeof builder.onStart === "function" &&
        typeof builder.onEnd === "function"
      if (!hasBuildLifecycle && options.persistent !== true) {
        throw new Error(
          "runtime Bun.plugin registration requires persistent: true for the JSX compiler",
        )
      }
      if (!hasBuildLifecycle && capabilityManifestPath !== null) {
        throw new Error(
          "capabilityManifestPath requires Bun build start/end lifecycle hooks",
        )
      }
      if (hasBuildLifecycle) {
        builder.onStart(() => {
          capabilityUsages.clear()
          refresh = discoverSourceFiles(roots).then(files => session.refreshFiles(files))
          return refresh
        })
      }
      builder.onLoad({filter: /\.(?:[cm]?jsx|[cm]?tsx)$/}, async ({path}) => {
        if (!session.accepts(path)) return undefined
        await refresh
        const result = await session.compileFile(path)
        if (!reported.has(result)) {
          reported.add(result)
          for (const diagnostic of result.diagnostics) {
            const key = `${diagnostic.file}:${diagnostic.component}:${diagnostic.code}`
            if (diagnosticKeys.has(key)) continue
            diagnosticKeys.add(key)
            console.warn(`${diagnostic.file}:${diagnostic.line}:${diagnostic.column} [${diagnostic.code}] ${diagnostic.message}`)
          }
        }
        capabilityUsages.set(path, result.capabilityUsages)
        return {contents: result.code, loader: sourceLoader(extname(path))}
      })
      if (hasBuildLifecycle) {
        builder.onEnd(async result => {
          try {
            if (result.success && capabilityManifestPath !== null) {
              const usages = [...capabilityUsages]
                .sort(([left], [right]) => left.localeCompare(right))
                .flatMap(([, values]) => values)
              const manifest = createCapabilityUsageManifest(usages)
              await mkdir(dirname(capabilityManifestPath), {recursive: true})
              await writeFile(
                capabilityManifestPath,
                serializeCapabilityUsageManifest(manifest),
                "utf8",
              )
            }
          } finally {
            if (options.persistent !== true) await session.close()
          }
        })
      }
    },
  }
}
