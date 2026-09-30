import {dirname, join} from "node:path"

/** Читает физические пакеты UI для проверки состава общего workspace Repo. */
export async function readUiWorkspaces(root: string): Promise<readonly (readonly [string, string, string])[]> {
  const result: Array<readonly [string, string, string]> = []
  for await (const path of new Bun.Glob("ui/**/package.json").scan({cwd: root})) {
    if (path === "ui/package.json" || /(?:^|\/)(?:node_modules|spec|test|tests|fixture|fixtures)(?:\/|$)/u.test(path)) continue
    const manifest = await Bun.file(join(root, path)).json() as {name: string; description: string}
    result.push([dirname(path), manifest.name, manifest.description])
  }
  return result.sort(([a], [b]) => a.localeCompare(b))
}
