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

/** Физические границы всех владельцев берутся из workspace Repo, включая вложенные Nodes. */
export async function readWorkspaceDirectories(root: string): Promise<readonly string[]> {
  const manifest = await Bun.file(join(root, "package.json")).json() as {workspaces: string[]}
  const includes = manifest.workspaces.filter(pattern => !pattern.startsWith("!")).map(pattern => new Bun.Glob(pattern))
  const excludes = manifest.workspaces.filter(pattern => pattern.startsWith("!")).map(pattern => new Bun.Glob(pattern.slice(1)))
  const directories: string[] = []
  for await (const path of new Bun.Glob("**/package.json").scan({cwd: root})) {
    const directory = dirname(path)
    if (directory === "." || !includes.some(pattern => pattern.match(directory))) continue
    if (excludes.some(pattern => pattern.match(directory) || pattern.match(`${directory}/`))) continue
    directories.push(directory)
  }
  return directories.sort()
}
