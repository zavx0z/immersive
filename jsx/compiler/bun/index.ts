/** Bun-интеграция сессии JSX: компиляция, жизненный цикл и usage manifest.

@packageDocumentation
*/
import {mkdir, writeFile} from "node:fs/promises"
import {realpathSync, statSync} from "node:fs"
import {dirname, extname, resolve} from "node:path"
import {discoverSourceFiles, commonCwd, sourceLoader} from "./src/files.ts"
import type {JsxPlugin} from "./contract/output.ts"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"
import {
  createCapabilityUsageManifest,
  serializeCapabilityUsageManifest,
} from "./src/capability-manifest.ts"
import type {JsxCompileResult} from "@zavx0z/immersive-jsx-compiler-session"
type CapabilityUsage = JsxCompileResult["capabilityUsages"][number]

import type {CreateJsxPluginOptions} from "./contract/input.ts"
export type {CreateJsxPluginOptions} from "./contract/input.ts"
export type {JsxPlugin} from "./contract/output.ts"

/**
Подключает общий JSX compiler к штатным callbacks Bun.

Плагин преобразует исходники без повторного запуска проверок разработки.
Неперсистентная сессия закрывается в onEnd, в том числе при ошибке.
*/
export default function createJsxBunPlugin(
  options: CreateJsxPluginOptions,
): JsxPlugin {
  const configuredCwd = resolve(options.cwd ?? process.cwd())
  if (options.sourceTransform !== undefined && typeof options.sourceTransform !== "function") throw new TypeError("sourceTransform requires a function")
  if (options.onCompiled !== undefined && typeof options.onCompiled !== "function") throw new TypeError("onCompiled requires a function")
  if (options.capabilityManifestPath !== undefined &&
    options.capabilityManifestPath.trim() === "") {
    throw new TypeError("capabilityManifestPath requires a non-empty path")
  }
  const capabilityManifestPath = options.capabilityManifestPath === undefined
    ? null
    : resolve(configuredCwd, options.capabilityManifestPath)
  const roots = options.sourceRoots.map((root) => resolve(configuredCwd, root))
  if (roots.length === 0) throw new TypeError("JSX plugin requires at least one source root")
  const escaped = (path: string) => path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const rootFilters = roots.flatMap(root => {
    const paths = [...new Set([root, realpathSync(root)])]
    const file = statSync(root).isFile()
    return paths.map(path => file ? `${escaped(path)}$` : `${escaped(path)}/(?!node_modules/)(?!.*\\/node_modules/).*\\.[cm]?[jt]sx?$`)
  })
  const sourceFilter = new RegExp(`^(?:${rootFilters.join("|")})`)
  const session = options.session ?? new JsxCompilerSession({
    cwd: options.cwd === undefined ? commonCwd(roots) : configuredCwd,
    sourceRoots: roots,
    ...(options.customConditions === undefined ? {} : {customConditions: options.customConditions}),
    ...(options.sourceFiles === undefined ? {} : {sourceFiles: options.sourceFiles}),
    ...(options.styleSourceRootIds === undefined
      ? {}
      : {styleSourceRootIds: options.styleSourceRootIds}),
  })
  const capabilityUsages = new Map<string, readonly CapabilityUsage[]>()
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
      builder.onLoad({filter: sourceFilter}, async ({path}) => {
        const source = await Bun.file(path).text()
        if (/\.d\.[cm]?ts$/.test(path) || !session.accepts(path)) return {contents: source, loader: sourceLoader(extname(path))}
        const contents = options.sourceTransform ? await options.sourceTransform(path, source) : source
        if (typeof contents !== "string") throw new TypeError("sourceTransform must return a string")
        if (!/\.[cm]?[jt]sx$/.test(path) &&
          !/from\s*["']@zavx0z\/immersive(?:-component(?:\/authoring)?|-browser\/authoring|\/XReact(?:\/browser)?)["']/.test(contents) &&
          !/\bfunction\s+use[A-Z0-9]/.test(contents)) return {contents, loader: sourceLoader(extname(path))}
        await refresh
        const result = await session.compileFile(path, contents === source ? undefined : contents)
        await options.onCompiled?.(path, contents, result)
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
