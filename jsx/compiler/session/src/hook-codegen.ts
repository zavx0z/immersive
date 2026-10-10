import type {FunctionDeclaration, Node, SourceFile} from "typescript/unstable/ast"
import {lowerHooks} from "./hook-lowering.ts"
import {guardedOperations} from "./dom-codegen.ts"
import {ownHookFields} from "./hook-fields.ts"

/** Отдельно компилируемый custom hook явно получает Document и запрос обновления. */
export function emitCustomHook(
  declaration: FunctionDeclaration,
  sourceFile: SourceFile,
  prefix: string,
  hooks: ReadonlyMap<number, Readonly<{name: string}>>,
  customs: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  presenceAliases: readonly string[],
): string {
  const body = declaration.body!
  const p = `${prefix}Custom`
  const lowered = ownHookFields(lowerHooks(declaration, sourceFile, body.getStart(sourceFile) + 1, body.getEnd() - 1, p, hooks, customs, symbols, code => [
    `${p}Accepted = {`,
    `commit: () => { ${code.commit.join("\n")} },`,
    `check: () => { ${code.checks.join("\n")}\n return true },`,
    `refs: () => { ${guardedOperations(code.refs, `${p}Refs`).join("\n")} },`,
    `insertion: () => { ${guardedOperations(code.insertion, `${p}Insertion`).join("\n")} },`,
    `layout: () => { ${guardedOperations(code.layout, `${p}Layout`).join("\n")} },`,
    `passive: () => { ${guardedOperations(code.passive, `${p}Passive`).join("\n")} },`,
    `}`,
  ].join("\n")), `${p}Owner`)
  const exported = declaration.modifiers?.some(modifier => modifier.getText(sourceFile) === "export")
  const defaultExport = declaration.modifiers?.some(modifier => modifier.getText(sourceFile) === "default")
  const parameters = declaration.parameters.map(parameter => parameter.getText(sourceFile)).join(", ")
  return [
    `${exported ? defaultExport ? "export default " : "export " : ""}function ${declaration.name!.text}(${p}Owner, document, ${p}Invalidate, ${p}GetSlotContent = () => (void 0), ${p}SlotNames = []) {`,
    `let ${p}OwnerDocument = document`,
    `let ${p}Disposed = false, ${p}Rendering = false, ${p}Context = null`,
    `const ${p}Identity = ${JSON.stringify(sourceFile.fileName + ":" + declaration.name!.text + ":")} + (${declaration.name!.text}.sequence = (${declaration.name!.text}.sequence ?? 0) + 1) + ":"`,
    `const ${p}SameDeps = ${prefix}SameDeps`,
    `const ${p}ReadContext = ${prefix}ReadContext`,
    `let ${p}SlotContent`,
    ...presenceAliases.map(name => `const ${name} = (name = "") => ${prefix}HasSlot(${p}SlotContent, name, ${p}SlotNames)`),
    ...([...hooks.values()].some(hook => hook.name === "useFrame" || hook.name === "useSpace") ? [`const ${p}Environment = ${prefix}Environment`] : []),
    ...lowered.fields,
    `let ${p}Accepted = {commit() {}, check() { return true }, refs() {}, insertion() {}, layout() {}, passive() {}}`,
    `return {`,
    `render(${p}NextContext${parameters ? `, ${parameters}` : ""}) {`,
    `${p}Context = ${p}NextContext`,
    `${p}SlotContent = ${p}GetSlotContent()`,
    `${p}Rendering = true`,
    `try {`,
    lowered.source,
    `} finally { ${p}Rendering = false }`,
    `},`,
    `commit() { ${p}Accepted.commit() },`,
    `check() { return ${p}Accepted.check() },`,
    `refs() { ${p}Accepted.refs() },`,
    `unchanged() { return ${lowered.memoChecks.map(value => `(${value})`).join(" && ") || "true"} },`,
    `adopt(nextDocument) { document = nextDocument; ${p}OwnerDocument = nextDocument; ${lowered.adopt.join("\n")} },`,
    `insertion() { ${p}Accepted.insertion() },`,
    `layout() { ${p}Accepted.layout() },`,
    `passive() { ${p}Accepted.passive() },`,
    `disconnect() { ${guardedOperations(lowered.disconnect, `${p}Disconnect`).join("\n")} },`,
    `dispose() { if (${p}Disposed) return; ${p}Disposed = true; ${guardedOperations(["this.disconnect()", ...lowered.dispose,
      ...(lowered.fieldNames.length ? [`for (const field of [${lowered.fieldNames.join(", ")}]) ${p}Owner[field] = (void 0)`] : []),
    ], `${p}Dispose`).join("\n")} },`,
    `}`,
    `}`,
    `Object.defineProperty(${declaration.name!.text}, Symbol.for("@zavx0z/immersive-jsx-compiler/compiled-hook-factory"), {value: true})`,
  ].join("\n")
}
