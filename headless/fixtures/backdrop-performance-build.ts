import {dirname, relative, resolve} from "node:path"

/** Собирает один harness с текущим или историческим WebGPU без изменения checkout. */
const [revision, output] = Bun.argv.slice(2)
if (!revision || !output) {
  throw new Error("Usage: bun headless/fixtures/backdrop-performance-build.ts <revision|working> <output>")
}
const root = resolve(import.meta.dir, "../..")
const git = (...args: string[]) => {
  const result = Bun.spawnSync(["git", "-C", root, ...args], {stdout: "pipe", stderr: "pipe"})
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString())
  }
  return result.stdout.toString()
}
const base = revision === "working" ? null : git("rev-parse", "--verify", `${revision}^{commit}`).trim()
const sources: Record<string, string> = {}
const result = await Bun.build({
  entrypoints: [resolve(root, "headless/fixtures/backdrop-performance.ts")],
  target: "bun",
  packages: "bundle",
  external: ["bun-webgpu"],
  plugins: base === null ? [] : [{
    name: "historical-webgpu",
    setup(build) {
      build.onLoad({filter: /\/webgpu\/src\/.*\.(?:ts|wgsl)$/u}, args => {
        const path = relative(root, args.path)
        if (!path.startsWith("webgpu/src/")) {
          return undefined
        }
        const contents = git("show", `${base}:${path}`)
        sources[path] = new Bun.CryptoHasher("sha256").update(contents).digest("hex")
        return {contents, loader: path.endsWith(".wgsl") ? "text" : "ts", resolveDir: dirname(args.path)}
      })
    },
  }],
})
if (!result.success || result.outputs.length !== 1) {
  throw new Error(result.logs.join("\n"))
}
await Bun.write(output, result.outputs[0]!)
const digest = (text: string) => new Bun.CryptoHasher("sha256").update(text).digest("hex")
await Bun.write(`${output}.source.json`, JSON.stringify({
  rendererRevision: base ?? git("rev-parse", "HEAD").trim(),
  rendererWorkingDiffSha256: base === null ? digest(git("diff", "--binary", "HEAD", "webgpu/src")) : null,
  historicalSources: sources,
  harnessRevision: git("rev-parse", "HEAD").trim(),
  harnessSha256: digest(await Bun.file(resolve(root, "headless/fixtures/backdrop-performance.ts")).text()),
  configurationSha256: digest(await Bun.file(resolve(root, "headless/fixtures/backdrop-performance-data.ts")).text()),
  note: "Only WebGPU source is replaced for historical builds; current harness and unchanged dependency sources are shared. Full execution-tree provenance is recorded at run time.",
}, null, 2) + "\n")
console.log(output)
