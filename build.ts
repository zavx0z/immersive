import {mkdir, realpath} from "node:fs/promises"
import {createHash} from "node:crypto"
import {dirname, relative, resolve} from "node:path"
import createJsxBunPlugin from "@zavx0z/immersive-jsx-compiler-bun"
import {buildDeclarations} from "./compiler/src/declarations.ts"
import {publicSourceExports} from "./compiler/src/public-sources.ts"

const root = import.meta.dir
const outdir = resolve(process.argv[2] ?? resolve(root, "dist"))
const manifest = await Bun.file(resolve(root, "package.json")).json()
const exports = Object.entries(manifest.exports as Record<string, {source?: string; browser?: string; bun?: string}>)
const browserEntries = exports.filter(([, value]) => value.browser && value.source)
const serverEntries = exports.filter(([, value]) => value.bun && value.source)
const sourceExports = await publicSourceExports(root, browserEntries.map(([subpath, value]) => [
  `@zavx0z/immersive${subpath === "." ? "" : subpath.slice(1)}`, resolve(root, value.source!),
]))
const entries = [...new Set([
  ...browserEntries.map(([, value]) => resolve(root, value.source!)),
  ...Object.values(sourceExports).flat().map(value => resolve(root, value.source)),
])]
const result = await Bun.build({
  entrypoints: entries,
  root,
  outdir,
  target: "browser",
  format: "esm",
  splitting: true,
  minify: true,
  sourcemap: "external",
  naming: {entry: "[dir]/[name].[ext]", chunk: "chunks/[hash].[ext]", asset: "assets/[hash].[ext]"},
  conditions: ["source"],
  loader: {".wgsl": "text"},
  plugins: [createJsxBunPlugin({
    cwd: root,
    sourceRoots: ["ui", "space", "nodes", "markdown", "typedoc"].map(path => resolve(root, path)),
    styleSourceRootIds: ["ui", "space", "nodes", "markdown", "typedoc"].map(path => `@zavx0z/immersive/${path}`),
  })],
  metafile: true,
})
if (!result.success) throw new AggregateError(result.logs, "Immersive build failed")
await mkdir(outdir, {recursive: true})
await Bun.write(resolve(outdir, "metafile.json"), JSON.stringify(result.metafile, null, 2))

// Node-инструменты используют те же готовые runtime-модули: DOM и планировщик
// не включаются повторно в Headless или compiler bundle.
const runtimeSources = new Map(await Promise.all(browserEntries.map(async ([subpath, value]) =>
  [await realpath(resolve(root, value.source!)), `@zavx0z/immersive${subpath === "." ? "" : subpath.slice(1)}`] as const)))
const runtimeModules = new Map([
  ["@zavx0z/immersive-dom", "@zavx0z/immersive"],
  ["@zavx0z/immersive-component", "@zavx0z/immersive/XReact"],
  ["@zavx0z/immersive-component/slot", "@zavx0z/immersive/XReact/slot"],
  ["@zavx0z/immersive-template/compiled", "@zavx0z/immersive/XReact/compiled"],
])
const server = await Bun.build({
  entrypoints: serverEntries.map(([, value]) => resolve(root, value.source!)),
  root, outdir, target: "bun", format: "esm", splitting: true, sourcemap: "external",
  naming: {entry: "[dir]/[name].[ext]", chunk: "server/chunks/[hash].[ext]", asset: "server/assets/[hash].[ext]"},
  conditions: ["source"], external: ["typescript", "typescript/*", "bun-webgpu"],
  plugins: [{
    name: "immersive-runtime",
    setup(builder) {
      builder.onResolve({filter: /^@zavx0z\/immersive(?:-|\/|$)/u}, async args => {
        if (!args.importer) return
        const known = runtimeModules.get(args.path)
        if (known) return {path: known, external: true}
        const target = await realpath(Bun.resolveSync(args.path, dirname(args.importer)))
        const specifier = runtimeSources.get(target)
        if (specifier) return {path: specifier, external: true}
      })
    },
  }],
  metafile: true,
})
if (!server.success) throw new AggregateError(server.logs, "Immersive tools build failed")
await Bun.write(resolve(outdir, "server-metafile.json"), JSON.stringify(server.metafile, null, 2))
const declarations = await buildDeclarations(root, outdir, [...new Set([...Object.keys(result.metafile!.inputs), ...Object.keys(server.metafile!.inputs)])]
  .filter(path => /\.[cm]?tsx?$/u.test(path) && !path.includes("node_modules"))
  .map(path => resolve(root, path)))
for (const source of [...entries, ...serverEntries.map(([, value]) => resolve(root, value.source!))]) {
  const path = resolve(outdir, relative(root, source).replace(/\.[cm]?tsx?$/u, ".d.ts"))
  const target = relative(dirname(path), declarations.declarationFor(source)).replaceAll("\\", "/").replace(/\.d\.ts$/u, ".js")
  const specifier = target.startsWith(".") ? target : `./${target}`
  const exported = new Bun.Transpiler({loader: source.endsWith("x") ? "tsx" : "ts"}).scan(await Bun.file(source).text()).exports
  await Bun.write(path, `export * from ${JSON.stringify(specifier)}\n${exported.includes("default") ? `export {default} from ${JSON.stringify(specifier)}\n` : ""}`)
}
await Bun.write(resolve(outdir, "browser.json"), JSON.stringify({
  schemaVersion: 1,
  name: manifest.name,
  version: manifest.version,
  entries: Object.fromEntries(browserEntries.map(([subpath, value]) => [
    `@zavx0z/immersive${subpath === "." ? "" : subpath.slice(1)}`,
    relative(resolve(root, "dist"), resolve(root, value.browser!)),
  ])),
  sourceExports,
  files: (await Promise.all(result.outputs.map(async artifact => ({
    path: relative(outdir, artifact.path),
    digest: createHash("sha256").update(new Uint8Array(await artifact.arrayBuffer())).digest("hex"),
  })))).sort((left, right) => left.path.localeCompare(right.path)),
}, null, 2))
console.log(`Immersive: ${entries.length} browser entries, ${serverEntries.length} tool entries, ${result.outputs.length + server.outputs.length} artifacts`)
