import type {CallExpression, FunctionDeclaration, Node, SourceFile} from "typescript/unstable/ast"
import {isCallExpression, isIdentifier, isFunctionLikeDeclaration, isReturnStatement} from "typescript/unstable/ast/is"

export type LoweredHooks = Readonly<{
  source: string
  fields: readonly string[]
  commit: readonly string[]
  refs: readonly string[]
  insertion: readonly string[]
  layout: readonly string[]
  passive: readonly string[]
  disconnect: readonly string[]
  checks: readonly string[]
  memoChecks: readonly string[]
  adopt: readonly string[]
  dispose: readonly string[]
}>

/** Каждое место вызова получает собственные переменные; общего hook dispatcher нет. */
export function lowerHooks(
  declaration: FunctionDeclaration,
  sourceFile: SourceFile,
  start: number,
  end: number,
  prefix: string,
  hooks: ReadonlyMap<number, Readonly<{name: string}>>,
  customHooks: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  beforeReturn?: (code: Omit<LoweredHooks, "source">) => string,
): LoweredHooks {
  const fields: string[] = []
  const commit: string[] = []
  const refs: string[] = []
  const insertion: string[] = []
  const layout: string[] = []
  const passive: string[] = []
  const disconnect: string[] = []
  const checks: string[] = []
  const memoChecks: string[] = []
  const adopt: string[] = []
  const dispose: string[] = []
  const edits: {start: number, end: number, text: string}[] = []
  const statements = new Map<number, string[]>()
  let index = 0
  const add = (call: CallExpression, lines: readonly string[], replacement: string) => {
    let statement: Node = call
    while (statement.parent !== declaration.body && statement.parent) statement = statement.parent
    const offset = statement.getStart(sourceFile)
    const before = statements.get(offset) ?? []
    before.push(...lines)
    statements.set(offset, before)
    edits.push({start: call.getStart(sourceFile), end: call.getEnd(), text: replacement})
  }
  const visit = (node: Node) => {
    if (node.getStart(sourceFile) < start || node.getEnd() > end) {
      node.forEachChild(visit)
      return
    }
    if (isCallExpression(node) && isIdentifier(node.expression)) {
      const id = symbols.get(node.expression) ?? -1
      const hook = hooks.get(id)
      const custom = customHooks.has(id)
      if (hook || custom) {
        const p = `${prefix}H${index++}`
        const args = node.arguments.map(argument => argument.getText(sourceFile))
        const name = hook?.name
        const input = args[0] ?? "(void 0)"
        const dependencies = args[1] ?? "(void 0)"
        if (custom) {
          fields.push(`const ${p} = ${node.expression.text}(${prefix}Owner, ${prefix}OwnerDocument, ${prefix}Invalidate, () => ${prefix}SlotContent, ${prefix}SlotNames)`)
          add(node, [], `${p}.render(${prefix}Context${args.length ? `, ${args.join(", ")}` : ""})`)
          commit.push(`${p}.commit()`)
          refs.push(`${p}.refs?.()`)
          insertion.push(`${p}.insertion()`)
          layout.push(`${p}.layout()`)
          passive.push(`${p}.passive()`)
          disconnect.push(`${p}.disconnect()`)
          checks.push(`if (!${p}.check()) return false`)
          memoChecks.push(`${p}.unchanged()`)
          adopt.push(`${p}.adopt(${prefix}OwnerDocument)`)
          dispose.push(`${p}.dispose()`)
        } else if (name === "useDocument") add(node, [], `${prefix}OwnerDocument`)
        else if (name === "useState" || name === "useReducer") {
          const reducer = name === "useReducer"
          fields.push(`let ${p}Ready = false, ${p}Value`, `const ${p}Queue = []`,
            `const ${p}Dispatch = action => { if (!${prefix}Disposed) { ${p}Queue.push(action); ${prefix}Invalidate() } }`)
          const initial = reducer ? (args[1] ?? "(void 0)") : input
          const initialize = reducer
            ? args[2] ? `${p}Init(${p}Argument)` : `${p}Argument`
            : `typeof ${p}Argument === "function" ? ${p}Argument() : ${p}Argument`
          add(node, [
            ...(reducer ? [`const ${p}Reducer = ${input}`] : []),
            `const ${p}Argument = ${initial}`,
            ...(reducer && args[2] ? [`const ${p}Init = ${args[2]}`] : []),
            `let ${p}Next = ${p}Ready ? ${p}Value : (${initialize})`,
            `const ${p}Count = ${p}Queue.length`,
            `for (let i = 0; i < ${p}Count; i++) { const action = ${p}Queue[i]; ${p}Next = ${reducer ? `${p}Reducer(${p}Next, action)` : `typeof action === "function" ? action(${p}Next) : action`} }`,
          ], `[${p}Next, ${p}Dispatch]`)
          commit.push(`${p}Value = ${p}Next`, `${p}Ready = true`, `${p}Queue.splice(0, ${p}Count)`)
        } else if (name === "useRef") {
          fields.push(`let ${p}Ready = false, ${p}Ref`)
          add(node, [`const ${p}Initial = ${input}`, `if (!${p}Ready) { ${p}Ref = {current: ${p}Initial}; ${p}Ready = true }`], `${p}Ref`)
        } else if (name === "useMemo" || name === "useCallback") {
          fields.push(`let ${p}Ready = false, ${p}Value, ${p}Dependencies`)
          add(node, [`const ${p}Factory = ${input}`, `const ${p}Deps = ${dependencies}`,
            `const ${p}Next = ${p}Ready && ${p}Deps !== (void 0) && ${prefix}SameDeps(${p}Dependencies, ${p}Deps) ? ${p}Value : ${name === "useMemo" ? `${p}Factory()` : `${p}Factory`}`], `${p}Next`)
          commit.push(`${p}Value = ${p}Next`, `${p}Dependencies = ${p}Deps`, `${p}Ready = true`)
        } else if (name === "useContext") add(node, [], `${prefix}ReadContext(${prefix}Context, ${input})`)
        else if (name === "useId") {
          fields.push(`const ${p}Id = ${prefix}Identity + ${JSON.stringify(`h${index}`)}`)
          add(node, [], `${p}Id`)
        } else if (name === "useDebugValue") add(node, [], `void (${args.join(", ") || "0"})`)
        else if (name === "useEffectEvent") {
          fields.push(`let ${p}Callback`, `const ${p}Event = (...args) => { if (${prefix}Rendering) throw new Error("Effect Event cannot run during render"); return ${p}Callback(...args) }`)
          add(node, [`const ${p}Next = ${input}`], `${p}Event`)
          commit.push(`${p}Callback = ${p}Next`)
        } else if (name === "useSyncExternalStore" || name === "useSpace") {
          const space = name === "useSpace"
          fields.push(`let ${p}Subscribe, ${p}Snapshot, ${p}Get, ${p}Unsubscribe = null, ${p}Pending = false`)
          add(node, space ? [
            `const ${p}Environment = ${prefix}Environment(${prefix}OwnerDocument)`,
            `const ${p}Selector = ${input}`,
            `const ${p}NextSubscribe = ${p}Environment.subscribe`,
            `const ${p}NextGet = () => ${p}Selector(${p}Environment.read())`,
            `const ${p}Next = ${p}NextGet()`,
          ] : [`const ${p}NextSubscribe = ${input}`, `const ${p}NextGet = ${args[1] ?? "(void 0)"}`,
            ...(args[2] ? [`void (${args[2]})`] : []), `const ${p}Next = ${p}NextGet()`], `${p}Next`)
          checks.push(`if (!Object.is(${p}NextGet(), ${p}Next)) return false`)
          memoChecks.push(`${p}Get === (void 0) || Object.is(${p}Get(), ${p}Snapshot)`)
          commit.push(`${p}Pending ||= ${p}Subscribe !== ${p}NextSubscribe || ${p}Unsubscribe === null`, `${p}Subscribe = ${p}NextSubscribe`, `${p}Get = ${p}NextGet`, `${p}Snapshot = ${p}Next`)
          layout.push(`if (${p}Pending) { ${p}Unsubscribe?.(); ${p}Pending = false; ${p}Unsubscribe = ${p}Subscribe(() => { if (!Object.is(${p}Get(), ${p}Snapshot)) ${prefix}OwnerDocument.transaction(${prefix}Invalidate) }); if (!Object.is(${p}Get(), ${p}Snapshot)) ${prefix}Invalidate() }`)
          disconnect.push(`${p}Unsubscribe?.()`, `${p}Unsubscribe = null`, `${p}Pending = true`)
        } else {
          const frame = name === "useFrame"
          const imperative = name === "useImperativeHandle"
          const phase = imperative ? refs : name === "useInsertionEffect" ? insertion : name === "useEffect" ? passive : layout
          const setup = frame
            ? `() => ${p}Environment.subscribeFrame((state, delta) => ${p}Latest(state, delta))`
            : imperative
            ? `() => { const value = (${args[1]})(); const ref = ${p}Ref; if (typeof ref === "function") { const cleanup = ref(value); return typeof cleanup === "function" ? cleanup : () => ref(null) } if (ref) { ref.current = value; return () => { if (ref.current === value) ref.current = null } } }`
            : input
          fields.push(`let ${p}Ready = false, ${p}Dependencies, ${p}Setup, ${p}Pending = null, ${p}Cleanup = null`,
            ...(frame ? [`let ${p}Latest`] : []))
          add(node, [
            ...(frame ? [`const ${p}Environment = ${prefix}Environment(${prefix}OwnerDocument)`, `${p}Latest = ${input}`] : []),
            ...(imperative ? [`const ${p}Ref = ${input}`] : []),
            `const ${p}NextSetup = ${setup}`,
            `const ${p}Deps = ${frame ? `[${p}Environment]` : imperative ? (args[2] ? `[...(${args[2]}), ${p}Ref]` : "(void 0)") : dependencies}`,
            `const ${p}Changed = !${p}Ready || ${p}Deps === (void 0) || !${prefix}SameDeps(${p}Dependencies, ${p}Deps)`,
          ], "void 0")
          commit.push(`${p}Setup = ${p}NextSetup`, `if (${p}Changed) { ${p}Pending = ${p}Setup; ${p}Dependencies = ${p}Deps; ${p}Ready = true }`)
          phase.push(`if (${p}Pending !== null) { ${p}Cleanup?.(); const setup = ${p}Pending; ${p}Pending = null; ${p}Cleanup = setup() ?? null }`)
          disconnect.push(`try { ${p}Cleanup?.() } finally { ${p}Cleanup = null; ${p}Pending = ${p}Setup }`)
        }
        return
      }
    }
    node.forEachChild(visit)
  }
  declaration.body?.forEachChild(visit)
  if (beforeReturn) {
    const code = beforeReturn({fields, commit, refs, insertion, layout, passive, disconnect, checks, memoChecks, adopt, dispose})
    const returns = (node: Node) => {
      if (isFunctionLikeDeclaration(node)) return
      if (isReturnStatement(node)) edits.push({start: node.getStart(sourceFile), end: node.getStart(sourceFile), text: code + "\n"})
      node.forEachChild(returns)
    }
    declaration.body?.forEachChild(returns)
    edits.push({start: end, end, text: "\n" + code + "\n"})
  }
  for (const [offset, lines] of statements) edits.push({start: offset, end: offset, text: lines.join("\n") + "\n"})
  let source = sourceFile.text.slice(start, end)
  edits.sort((a, b) => b.start - a.start || b.end - a.end)
  for (const edit of edits) source = source.slice(0, edit.start - start) + edit.text + source.slice(edit.end - start)
  return {source, fields, commit, refs, insertion, layout, passive, disconnect, checks, memoChecks, adopt, dispose}
}
