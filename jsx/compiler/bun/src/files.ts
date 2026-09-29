import {statSync} from "node:fs"
import {stat} from "node:fs/promises"
import {dirname, relative, resolve, sep} from "node:path"

export const discoverSourceFiles = async (roots: readonly string[]): Promise<readonly string[]> => {
  const files: string[] = []
  const pattern = new Bun.Glob("**/*.{js,jsx,ts,tsx,mjs,mjsx,mts,mtsx,cjs,cjsx,cts,ctsx}")
  for (const root of roots) {
    const metadata = await stat(root)
    if (metadata.isFile()) {
      files.push(root)
      continue
    }
    for await (const path of pattern.scan({cwd: root, onlyFiles: true})) {
      if (path.split(sep).includes("node_modules")) continue
      files.push(resolve(root, path))
    }
  }
  return Object.freeze(files)
}

export const commonCwd = (roots: readonly string[]): string => {
  let candidate = statSync(roots[0]!).isDirectory() ? roots[0]! : dirname(roots[0]!)
  while (!roots.every(root => lexicallyInside(candidate, root))) {
    const parent = dirname(candidate)
    if (parent === candidate) return candidate
    candidate = parent
  }
  return candidate
}

export const sourceLoader = (extension: string): "js" | "jsx" | "ts" | "tsx" => {
  if (extension === ".jsx") return "tsx"
  if (extension === ".tsx") return "tsx"
  if (extension.endsWith("js")) return "js"
  return "ts"
}

function lexicallyInside(root: string, path: string): boolean {
  const child = relative(root, path)
  return child === "" || (child !== ".." && !child.startsWith(`..${sep}`) && !child.startsWith(sep))
}
