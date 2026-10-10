import {createHash} from "node:crypto"
import type {LoweredHooks} from "./hook-lowering.ts"
import {emitRange} from "./range-codegen.ts"
import {emitStaticChild} from "./static-child-codegen.ts"
import {nativeElementClasses} from "../contract/native-elements.ts"
import {ownHookFields} from "./hook-fields.ts"
import {SyntaxKind} from "typescript/unstable/ast"
import {createScanner} from "typescript/unstable/ast/scanner"

export type DirectBinding = Readonly<{
  kind: "text" | "property" | "style" | "event" | "ref" | "range"
  target?: string
  name?: string
  type?: string
  capture?: boolean
  start?: string
  end?: string
  staticType?: string
  input?: string
}>

export type DirectComponentPlan = Readonly<{
  name: string
  exported: boolean
  defaultExport: boolean
  parameter: string
  parameterDefault: string | null
  slotParameter: string | null
  slotBinding: string
  slots: readonly string[]
  rootTag: string | null
  sourceIdentity: string
  helper: string
  presenceAliases: readonly string[]
  inputNames?: readonly string[]
  mount: readonly string[]
  roots: readonly string[]
  bindings: readonly DirectBinding[]
  writes: readonly string[]
  styleSheets: string
  hooks: LoweredHooks
}>


export function directRootClass(tag: string | null): string {
  return tag !== null && Object.prototype.hasOwnProperty.call(nativeElementClasses, tag) ? nativeElementClasses[tag as keyof typeof nativeElementClasses] : "DOMGroup"
}

export function guardedOperations(lines: readonly string[], name: string): string[] {
  if (lines.length < 2) return [...lines]
  return [`let ${name}Failed = false, ${name}Failure`, ...lines.map(line => `try { ${line} } catch (error) { if (!${name}Failed) { ${name}Failed = true; ${name}Failure = error } }`), `if (${name}Failed) throw ${name}Failure`]
}

/** Конкретный класс исполняет только известные поля и операции своего исходника. */
export function emitDomComponent(plan: DirectComponentPlan): string {
  const p = plan.helper
  const hooks = ownHookFields(plan.hooks, "this", `${p}FieldClass.#`)
  const inputNames = [...new Set(plan.inputNames ?? [])]
  const rootClass = directRootClass(plan.rootTag)
  const factoryRoot = rootClass === "DOMGroup" && plan.rootTag !== null
  const intrinsic = plan.rootTag !== null
  const rootInputs = intrinsic ? plan.bindings.filter(binding => binding.kind === "property" && binding.target === plan.roots[0] && binding.input !== undefined) : []
  const nativeInputs = rootInputs.filter(binding => rootInputs.every(other => other.input !== binding.input || other.name === binding.name))
  const hasNativeInputs = nativeInputs.length > 0
  const usesSlotScope = plan.slots.length > 0 || plan.presenceAliases.length > 0 || hooks.fields.some(line => line.includes(`${p}SlotContent`) || line.includes(`${p}SlotNames`))
  const snapshotInputs = hasNativeInputs
    ? `Object.fromEntries([...new Set([...Reflect.ownKeys(${p}Props), ...${p}NativeInputs.keys()])].map(name => [name, ${p}Props[name]]))`
    : `Object.fromEntries(Reflect.ownKeys(${p}Props).map(name => [name, ${p}Props[name]]))`
  const identity = createHash("sha256").update(`${plan.sourceIdentity}\0${plan.name}`).digest("hex").slice(0, 12)
  const fields: string[] = [...plan.presenceAliases.map(name => `const ${name} = (name = "") => ${p}HasSlot(${p}SlotContent, name, ${p}SlotNames)`), ...hooks.fields]
  const prepare: string[] = []
  const apply: string[] = []
  const checks: string[] = [...hooks.checks]
  const rangeRefs: string[] = [], rangeInsertion: string[] = [], rangeLayout: string[] = [], rangePassive: string[] = []
  const rollback: string[] = []
  const commit: string[] = [...hooks.commit]
  const rangeCommits = new Set<string>()
  const attachRefs: string[] = []
  const disconnect: string[] = [...hooks.disconnect]
  const cleanup: string[] = [...hooks.dispose]
  const nativeTags = new Map(plan.mount.flatMap(line => {
    const match = /^const (\w+) = document\.createElement\(("[^"]+")\)$/.exec(line)
    return match ? [[match[1]!, JSON.parse(match[2]!) as string] as const] : []
  }))
  for (const [index, binding] of plan.bindings.entries()) {
    const b = `${p}B${index}`
    const next = `${p}Next${index}`
    const target = binding.target
    const knownHTML = directRootClass(nativeTags.get(target ?? "") ?? null).startsWith("HTML")
    if (binding.kind === "text" || binding.kind === "property" || binding.kind === "style") {
      if (binding.kind === "property" && !knownHTML) {
        fields.push(`const ${b}Reflected = !(${target} instanceof ${p}HTMLElement) && ${p}HasSetter(${target}, ${JSON.stringify(binding.name)})`,
          `const ${b}Initial = ${b}Reflected ? Reflect.get(${target}, ${JSON.stringify(binding.name)}) : undefined`,
          `let ${b}Value = Symbol()`)
        commit.push(`${b}Value = ${next}`)
      }
      const operation = binding.kind === "text"
        ? `${p}PrepareText(${target}, ${p}Text(${next}))`
        : binding.kind === "style"
        ? `${p}PrepareProperty(${p}StyleOperation(${target}, ${next}))`
        : knownHTML ? `${p}PrepareProperty(${p}Property(${target}, ${JSON.stringify(binding.name)}, ${next}))`
        : `${b}Reflected ? Object.is(${b}Value, ${next}) ? null : ${p}PrepareProperty(${p}Property(${target}, ${JSON.stringify(binding.name)}, ${next} ?? ${b}Initial, true)) : ${p}PrepareProperty(${p}Property(${target}, ${JSON.stringify(binding.name)}, ${next}))`
      const rootInput = nativeInputs.includes(binding)
      prepare.push(`const ${b}Patch = ${rootInput ? `${p}NativeInputs.has(${JSON.stringify(binding.input)}) && (!inputs || !inputs.changed(${JSON.stringify(binding.input)})) ? null : ` : ""}${operation}`)
      if (rootInput && binding.kind === "property" && !knownHTML) {
        const entry = commit.indexOf(`${b}Value = ${next}`)
        commit[entry] = `if (!${p}NativeInputs.has(${JSON.stringify(binding.input)}) || inputs?.changed(${JSON.stringify(binding.input)})) ${b}Value = ${next}`
      }
      apply.push(`${p}Applied = ${index + 1}; ${b}Patch?.apply()`)
      rollback.unshift(`if (${p}Applied > ${index}) ${b}Patch?.rollback()`)
    } else if (binding.kind === "event") {
      fields.push(`const ${b}Event = new ${p}EventBinding(${target}, ${JSON.stringify(binding.type)}, ${!!binding.capture})`)
      prepare.push(`const ${b}EventPatch = ${b}Event.prepare(${next}, false)`)
      commit.push(`${b}EventPatch?.apply()`)
      cleanup.push(`${b}Event.dispose()`)
    } else if (binding.kind === "ref") {
      fields.push(`let ${b}Ref = null, ${b}Cleanup = null`)
      attachRefs.push(`if (${b}Ref !== ${next}) { ${b}Cleanup?.(); ${b}Cleanup = null; ${b}Ref = ${next}; ${b}Cleanup = ${p}AttachRef(${b}Ref, ${target}) }`)
      disconnect.push(`try { ${b}Cleanup?.() } finally { ${b}Cleanup = null; ${b}Ref = null }`)
    } else {
      fields.push(`const ${b}Range = ${binding.staticType ? emitStaticChild(p, binding.start!, binding.end!, binding.staticType) : emitRange(p, binding.start!, binding.end!)}`)
      prepare.push(`const ${b}Patch = ${b}Range.prepare(${next}${binding.staticType ? `, ${next}Content, ${next}Key` : ""}, nextContext)`, `${p}PreparedRanges.push(${b}Patch)`)
      checks.push(`if (!${b}Patch.check()) return false`)
      rangeRefs.push(`${b}Patch.refs?.()`)
      rangeInsertion.push(`${b}Patch.insertion?.()`)
      rangeLayout.push(`${b}Patch.layout?.()`)
      rangePassive.push(`${b}Patch.passive?.()`)
      apply.push(`${p}Applied = ${index + 1}; ${b}Patch.apply()`)
      rollback.unshift(`${b}Patch.rollback()`)
      commit.push(`${b}Patch.commit()`)
      rangeCommits.add(`${b}Patch.commit()`)
      cleanup.push(`${b}Range.dispose()`)
    }
  }
  const mount = [...plan.mount]
  if (intrinsic && plan.roots[0]) {
    const target = plan.roots[0]
    const rootCreation = `const ${target} = document.createElement(${JSON.stringify(plan.rootTag)})`
    const index = mount.indexOf(rootCreation)
    if (index < 0) throw new Error(`Missing intrinsic root creation for ${plan.name}`)
    mount[index] = `const ${target} = this`
  }
  const superArguments = !intrinsic ? "document"
    : rootClass === "HTMLElement" || /^(h[1-6]|tbody|thead|tfoot|td|th)$/.test(plan.rootTag!)
      ? `document, ${JSON.stringify(plan.rootTag)}` : "document"
  const parameter = plan.slotParameter ?? plan.parameter
  const phaseOperations = {
    refs: [...rangeRefs, ...attachRefs, ...hooks.refs], insertion: [...hooks.insertion, ...rangeInsertion],
    layout: [...hooks.layout, ...rangeLayout], passive: [...hooks.passive, ...rangePassive],
  }
  const phases = Object.entries(phaseOperations).filter(([, operations]) => operations.length > 0)
  const hasLayout = phaseOperations.layout.length > 0
  const hasPassive = phaseOperations.passive.length > 0
  const hasStyles = plan.styleSheets !== "[]"
  const hasHookFields = hooks.fields.length > 0
  const observesInputs = nativeInputs.length > 0
  const canInvalidate = hasHookFields || observesInputs
  const needsConnection = hasStyles || phases.length > 0 || canInvalidate
  const phaseCalls = (receiver: string) => [
    ...(phaseOperations.refs.length ? [`${receiver}.refs()`] : []),
    ...(phaseOperations.insertion.length ? [`${receiver}.insertion()`] : []),
    ...(hasLayout ? [`${p}OwnerDocument.enqueueTask(${p}LayoutTask)`] : hasPassive ? [`${p}OwnerDocument.enqueueTask(${p}PassiveTask)`] : []),
  ]
  const cancelPhases = [hasLayout ? `${p}OwnerDocument.cancelTask(${p}LayoutTask)` : "", hasPassive ? `${p}OwnerDocument.cancelTask(${p}PassiveTask)` : ""].filter(Boolean)
  const authoredDefault = `${p}AuthorDefault`
  const lines = [
    `${plan.exported ? "export " : ""}class ${plan.name}${factoryRoot ? "" : ` extends ${p}${rootClass}`} {`,
    `  static readonly [${p}ConstructorBrand] = true as const`,
    ...hooks.fieldNames.map(name => `  static #${name} = Symbol()`),
    ...(hooks.fieldNames.length ? [`  static #${p}HookFields = [${hooks.fieldNames.map(name => `this.#${name}`).join(", ")}]`] : []),
    ...inputNames.map((_, index) => `  static #${p}Input${index}Field = Symbol()`),
    ...(inputNames.length ? [`  static #${p}InputFields = new Map([${inputNames.map((name, index) => `[${JSON.stringify(name)}, this.#${p}Input${index}Field]`).join(", ")}])`] : []),
    `  static slots = Object.freeze(${JSON.stringify(plan.slots)} as const)`,
    `  static displayName = ${JSON.stringify(plan.name)}`,
    `  static nativeTag = ${intrinsic && !factoryRoot ? JSON.stringify(plan.rootTag) + " as const" : "null"}`,
    ...(factoryRoot ? [`  static [Symbol.hasInstance](value) { for (let constructor = value?.[${p}InstanceConstructor]; typeof constructor === "function"; constructor = Object.getPrototypeOf(constructor)) if (constructor === this) return true; return false }`] : []),
    `  static styleSheets = ${plan.styleSheets}`,
    `  static sequence = 0`,
    `  constructor(document, initialProps, initialContent, initialContext = null) {`,
    ...(factoryRoot ? [`    const owner = document.createElement(${JSON.stringify(plan.rootTag)})`, `    Object.defineProperty(owner, ${p}InstanceConstructor, {value: new.target})`] : [`    super(${superArguments})`, `    const owner = this`]),
    `    document = owner.ownerDocument`,
    `    const constructor = new.target`,
    `    if (initialProps !== undefined) ${plan.name}.prototype.${p}Initialize.call(owner, document, initialProps, initialContent, initialContext, constructor)`,
    `    else {`,
    `      let connection = null, disposed = false, content = initialContent`,
    `      const install = () => {`,
    `      owner.update = (props, nextContent = content, context = initialContext) => owner.ownerDocument.transaction(() => {`,
    `        if (disposed) throw new Error("Cannot update a disposed DOM component")`,
    `        connection?.dispose()`,
    `        const origins = ${p}CaptureOrigins(owner.ownerDocument, owner), children = [...(owner.childNodes ?? owner.nodes)]`,
    `        try { ${plan.name}.prototype.${p}Initialize.call(owner, owner.ownerDocument, props, nextContent, context, constructor) }`,
    `        catch (error) { try { owner.dispose() } finally { owner.replaceChildren(...children); origins.restore(); disposed = false; install() }; throw error }`,
    `      })`,
    `      owner.dispose = () => { disposed = true; connection?.dispose(); owner.remove() }`,
    `      Object.defineProperties(owner, {props: {configurable: true, get: () => undefined, set: props => owner.update(props)}, content: {configurable: true, get: () => content, set: next => { content = next }}})`,
    `      }`,
    `      install()`,
    `      connection = ${p}ObserveConnection(owner, {connected: () => owner.update(undefined)})`,
    `    }`,
    ...(factoryRoot ? [`    return owner`] : []),
    `  }`,
    `  ${p}Initialize(document, initialProps, initialContent, initialContext, ${p}Type) {`,
    `    let ${p}OwnerDocument = document`,
    `    const ${p}Owner = this`,
    ...(hooks.fieldNames.length || inputNames.length ? [`    const ${p}FieldClass = ${plan.name}`] : []),
    ...(intrinsic && plan.slots.length ? [
      `    if (this.childNodes.length) {`,
      `      if (initialContent !== undefined) throw new TypeError("Cannot combine initial DOM children with explicit content")`,
      `      const content = Object.create(null)`,
      `      for (const node of [...this.childNodes]) { const name = node.nodeType === 1 ? node.getAttribute("slot") ?? "" : ""; (content[name] ??= []).push(node) }`,
      `      initialContent = content`,
      `    }`,
    ] : intrinsic ? [`    if (this.childNodes.length) this.replaceChildren()`] : []),
    `    const ${p}Identity = ${JSON.stringify(identity + ":")} + ${plan.name}.sequence++ + ":"`,
    `    let ${p}Disposed = false, ${p}Rendering = false, ${p}Dirty = false, ${p}Connected = false, ${p}Updating = false`,
    `    let ${p}Initialized = false, ${p}Forced = false`,
    `    let ${p}PendingUpdate = null`,
    `    let ${p}InputFields = ${inputNames.length ? `${p}FieldClass.#${p}InputFields` : "new Map()"}`,
    ...(hasNativeInputs ? [
      `    let ${p}MissingInputs = null`,
      `    const ${p}NativeInputs = new Map([${nativeInputs.map(binding => `[${JSON.stringify(binding.input)}, ${p}NativeProperty(this, ${JSON.stringify(binding.name)})]`).join(", ")}].filter(([, name]) => name !== null))`,
      `    const ${p}NativeCommands = ${p}NativeInputs.size && !(this instanceof ${p}HTMLElement) ? new Map() : null`,
      `    const ${p}ReadInput = name => { if (!${p}NativeInputs.has(name)) return this[${p}InputFields.get(name)]; const value = Reflect.get(this, ${p}NativeInputs.get(name)); if (!${p}MissingInputs?.has(name)) return value; if (Object.is(value, ${p}MissingInputs.get(name))) return undefined; ${p}MissingInputs.delete(name); return value }`,
    ] : [`    const ${p}ReadInput = name => this[${p}InputFields.get(name)]`]),
    `    const ${p}DraftInputs = input => {`,
    `      const keys = input == null ? [] : Reflect.ownKeys(input)`,
    `      for (const name of keys) if (!${p}InputFields.has(name)) { ${inputNames.length ? `if (${p}InputFields === ${p}FieldClass.#${p}InputFields) ${p}InputFields = new Map(${p}InputFields); ` : ""}${p}InputFields.set(name, Symbol(typeof name === "string" ? name : undefined)) }`,
    `      let accepted = false, history = null`,
    `      const value = new Proxy(Object.create(null), {`,
    `        get: (_, name) => history !== null ? history[name] : accepted ? ${p}ReadInput(name) : ${hasNativeInputs ? `${p}NativeInputs.has(name) && ${p}NativeCommands?.has(name) && Object.is(${p}NativeCommands.get(name), input?.[name]) ? ${p}ReadInput(name) : ` : ""}Object.prototype.hasOwnProperty.call(input ?? {}, name) ? input[name] : ${hasNativeInputs ? `(${p}Initialized || input === undefined) && ${p}NativeInputs.has(name) ? ${p}ReadInput(name) : ` : ""}undefined,`,
    `        has: (_, name) => keys.includes(name),`,
    `        ownKeys: () => keys,`,
    `        getOwnPropertyDescriptor: (_, name) => keys.includes(name) ? {configurable: true, enumerable: true, value: value[name], writable: false} : undefined,`,
    `        set: () => false, deleteProperty: () => false, defineProperty: () => false,`,
    `      })`,
    `      return {value, ${hasNativeInputs ? `changed: name => !${p}NativeCommands?.has(name) || !Object.is(${p}NativeCommands.get(name), input?.[name]), ` : ""}retire: snapshot => { history = snapshot }, commit: () => { ${hasNativeInputs ? `let missing = null; for (const [name, native] of ${p}NativeInputs) if (value[name] === undefined) (missing ??= new Map()).set(name, Reflect.get(this, native)); ` : ""}for (const [name, field] of ${p}InputFields) ${hasNativeInputs ? `if (!${p}NativeInputs.has(name)) ` : ""}this[field] = input?.[name]; ${hasNativeInputs ? `for (const name of ${p}NativeInputs.keys()) ${p}NativeCommands?.set(name, input?.[name]); ${p}MissingInputs = missing; ` : ""}accepted = true; input = null }}`,
    `    }`,
    `    let ${p}Props, ${p}Content = initialContent, ${p}Context = initialContext`,
    `    let ${p}RetireInputs = null`,
    `    let ${p}MemoInputs`,
    ...(hasStyles ? [`    let ${p}StyleLease = null`] : []),
    ...(usesSlotScope ? [
      `    const ${p}SlotNames = ${plan.name}.slots`,
      `    let ${p}ContentInput = initialContent ?? initialProps?.[${p}SlotsKey]`,
      `    let ${p}RetainedContent = ${p}ContentInput === undefined ? undefined : ${p}RetainContent(${p}OwnerDocument, ${p}ContentInput, ${p}SlotNames)`,
      `    let ${p}SlotContent = ${p}RetainedContent`,
    ] : [
      `    const ${p}InitialContentInput = initialContent ?? initialProps?.[${p}SlotsKey]`,
      `    if (${p}InitialContentInput !== undefined) ${p}RetainContent(${p}OwnerDocument, ${p}InitialContentInput, ${plan.name}.slots)`,
    ]),
    `    const ${p}Task = () => this.update(${p}Props, ${p}Content, ${p}Context)`,
    `    const ${p}Invalidate = () => { if (${p}Disposed) return; ${p}Forced = true; if (${p}Rendering || ${p}Updating) ${p}Dirty = true; else ${p}OwnerDocument.enqueueTask(${p}Task) }`,
    ...mount.map(line => `    ${line.replace(/^(const [A-Za-z_$]\w* = )document\./, `$1${p}OwnerDocument.`)}`),
    ...(!intrinsic ? [`    this.append(${plan.roots.join(", ")})`] : []),
    ...fields.map(line => `    ${line}`),
    ...(phases.length ? [`    let ${p}AcceptedPhases = {${phases.map(([name]) => `${name}() {}`).join(", ")}}`] : []),
    ...(hasPassive ? [`    const ${p}PassiveTask = () => { if (${p}Connected) ${p}AcceptedPhases.passive() }`] : []),
    ...(hasLayout ? [`    const ${p}LayoutTask = () => { if (${p}Connected) { ${p}AcceptedPhases.layout(); ${hasPassive ? `${p}OwnerDocument.enqueueTask(${p}PassiveTask)` : ""} } }`] : []),
    `    this.prepareUpdate = (nextProps, nextContent = ${p}Content, nextContext = ${p}Context) => {`,
    `      if (${p}Disposed) throw new Error("Cannot update a disposed DOM component")`,
    `      if (${p}Initialized && !${p}Forced && nextContext === ${p}Context && nextContent === ${p}Content && ${hooks.memoChecks.map(value => `(${value})`).join(" && ") || "true"} && ${p}Type.memoCompare?.(${p}MemoInputs, nextProps)) {`,
    `        const inputs = ${p}Initialized && nextProps === ${p}Props ? null : ${p}DraftInputs(${plan.parameterDefault ? `nextProps === undefined ? (${authoredDefault}) : nextProps` : "nextProps"})`,
    `        return {check: () => true, apply() {}, rollback() {}, commit: () => { if (inputs) { ${p}RetireInputs?.(${snapshotInputs}); const snapshot = {...inputs.value}; inputs.commit(); ${p}Props = inputs.value; ${p}RetireInputs = inputs.retire; ${p}MemoInputs = snapshot } }, refs() {}, insertion() {}, layout() {}, passive() {}}`,
    `      }`,
    `      const previousContext = ${p}Context${usesSlotScope ? `, previousSlotContent = ${p}SlotContent` : ""}`,
    `      const previousFocus = ${p}OwnerDocument.activeElement`,
    `      const ${p}PreparedRanges = []`,
    `      ${p}Rendering = true`,
    `      ${p}Dirty = false`,
    `      try {`,
    `        const inputs = ${p}Initialized && nextProps === ${p}Props ? null : ${p}DraftInputs(${plan.parameterDefault ? `nextProps === undefined ? (${authoredDefault}) : nextProps` : "nextProps"})`,
    `        const authoredProps = inputs?.value ?? ${p}Props`,
    `        const previousInputs = inputs && ${p}Props ? ${snapshotInputs} : null`,
    `        const memoInputs = ${p}Type.memoCompare ? {...authoredProps} : undefined`,
    `        const nextContentInput = nextContent ?? nextProps?.[${p}SlotsKey]`,
    ...(usesSlotScope ? [`        const nextRetainedContent = nextContentInput === ${p}ContentInput ? ${p}RetainedContent : nextContentInput === undefined ? undefined : ${p}RetainContent(${p}OwnerDocument, nextContentInput, ${p}SlotNames)`]
      : [`        if (nextContentInput !== undefined) ${p}RetainContent(${p}OwnerDocument, nextContentInput, ${plan.name}.slots)`]),
    `        ${p}Context = nextContext`,
    ...(usesSlotScope ? [`        ${p}SlotContent = nextRetainedContent`] : []),
    `        const ${parameter} = authoredProps`,
    plan.slotBinding,
    hooks.source,
    ...plan.writes,
    ...prepare,
    `        let ${p}Applied = 0`,
    ...(phases.length ? [`        const phases = {`, ...phases.flatMap(([name, operations]) => [
      `${name}: () => { if (${p}Connected) {`, ...guardedOperations(operations, `${p}${name}`), `} },`,
    ]), `}`] : []),
    ...(observesInputs ? [
      `        const ${p}Apply = () => {`, ...apply, `}`,
      `        const ${p}Rollback = () => {`, ...guardedOperations([...rollback, `if (previousFocus?.isConnected) previousFocus.focus?.()`], `${p}Rollback`), `}`,
    ] : []),
    `        return {`,
    ...(phases.length ? [`          ...phases,`] : []),
    `          check: () => { if (${p}Dirty) return false; ${checks.join("\n")}\n return true },`,
    ...(observesInputs ? [
      `          apply: ${p}NativeInputs.size ? () => ${p}Connection.suppressChanges(${p}Apply) : ${p}Apply,`,
      `          rollback: ${p}NativeInputs.size ? () => ${p}Connection.suppressChanges(${p}Rollback) : ${p}Rollback,`,
    ] : [
      `          apply: () => {`, ...apply, `          },`,
      `          rollback: () => {`, ...guardedOperations([...rollback, `if (previousFocus?.isConnected) previousFocus.focus?.()`], `${p}Rollback`), `          },`,
    ]),
    `          commit: () => {`,
    ...(rangeCommits.size ? [`let ${p}CommitFailed = false, ${p}CommitFailure`] : []),
    ...commit.map(line => rangeCommits.has(line) ? `try { ${line} } catch (${p}CommitError) { if (!${p}CommitFailed) { ${p}CommitFailed = true; ${p}CommitFailure = ${p}CommitError } }` : line),
    `            ${p}Applied = 0`,
    `            if (inputs) { if (previousInputs) ${p}RetireInputs?.(previousInputs); inputs.commit(); ${p}RetireInputs = inputs.retire }`,
    `            ${p}Props = authoredProps; ${p}Content = nextContent; ${p}Context = nextContext${usesSlotScope ? `; ${p}SlotContent = nextRetainedContent` : ""}`,
    `            ${p}MemoInputs = memoInputs`,
    ...(usesSlotScope ? [`            ${p}ContentInput = nextContentInput; ${p}RetainedContent = nextRetainedContent`] : []),
    ...(phases.length ? [`            ${p}AcceptedPhases = phases`] : []),
    `            ${p}Initialized = true; ${p}Forced = false`,
    ...(rangeCommits.size ? [`if (${p}CommitFailed) throw ${p}CommitFailure`] : []),
    `          },`,
    `        }`,
    `      } catch (error) { for (const range of ${p}PreparedRanges) range.rollback(); throw error }`,
    `      finally { ${p}Context = previousContext; ${usesSlotScope ? `${p}SlotContent = previousSlotContent; ` : ""}${p}Rendering = false }`,
    `    }`,
    `    this.update = (nextProps, nextContent = ${p}Content, nextContext = ${p}Context) => {`,
    `      if (${p}Updating) { ${p}PendingUpdate = [nextProps, nextContent, nextContext]; ${p}Dirty = true; return }`,
    `      ${p}Updating = true`,
    `      try {`,
    `        let attempts = 0`,
    `        do {`,
    `          if (++attempts > 25) throw new Error("Unstable DOM component update")`,
    `          const prepared = this.prepareUpdate(nextProps, nextContent, nextContext)`,
    `          if (!prepared.check()) { prepared.rollback(); ${p}Dirty = true; continue }`,
    `          ${p}OwnerDocument.transaction(() => {`,
    `            try { prepared.apply() } catch (error) { prepared.rollback(); throw error }`,
    ...guardedOperations([`prepared.commit()`, ...phaseCalls("prepared")], `${p}Phases`),
    `          })`,
    `          if (${p}PendingUpdate !== null) { [nextProps, nextContent, nextContext] = ${p}PendingUpdate; ${p}PendingUpdate = null }`,
    `          else if (${p}Dirty) { nextProps = ${p}Props; nextContent = ${p}Content; nextContext = ${p}Context }`,
    `        } while (${p}Dirty)`,
    `      } finally { ${p}Updating = false }`,
    `    }`,
    ...(disconnect.length ? [`    const ${p}Disconnect = () => {`, ...guardedOperations(disconnect, `${p}Disconnect`), `}`] : []),
    `    const ${p}Connection = ${p}ObserveConnection(this, {`,
    ...(observesInputs ? [`attributes: [${nativeInputs.map(binding => `[${JSON.stringify(binding.input)}, ${JSON.stringify(binding.name?.toLowerCase())}]`).join(", ")}].filter(([input]) => ${p}NativeInputs.has(input)).map(([, name]) => name), properties: [...${p}NativeInputs.values()], changed: () => ${p}OwnerDocument.transaction(${p}Invalidate),`] : []),
    `connected: () => {`,
    `      if (${p}Disposed || ${p}Connected) return`,
    `      ${p}Connected = true`,
    ...(hasStyles ? [`      ${p}StyleLease = ${p}AcquireStyles(${p}OwnerDocument, ${plan.name}.styleSheets)`] : []),
    `      ${p}OwnerDocument.transaction(() => {`,
    ...guardedOperations(phaseCalls(`${p}AcceptedPhases`), `${p}Connect`),
    `      })`,
    `    }, disconnected: () => {`,
    `      if (!${p}Connected) return`,
    `      ${p}Connected = false`,
    ...cancelPhases,
    ...(disconnect.length ? [hasStyles ? `try { ${p}Disconnect() } finally { ${p}StyleLease?.release(); ${p}StyleLease = null }` : `${p}Disconnect()`] : hasStyles ? [`${p}StyleLease?.release(); ${p}StyleLease = null`] : []),
    `    }, adopted: () => {`,
    `      ${p}OwnerDocument.cancelTask(${p}Task)`,
    ...cancelPhases,
    `      document = this.ownerDocument; ${p}OwnerDocument = document`,
    ...hooks.adopt,
    `      if (${p}Forced) ${p}OwnerDocument.enqueueTask(${p}Task)`,
    `    }})`,
    `    Object.defineProperties(this, {props: {configurable: true, get: () => ${p}Props, set: next => this.update(next)}, content: {configurable: true, get: () => ${p}Content, set: next => this.update(${p}Props, next)}})`,
    `    this.dispose = () => {`,
    `      if (${p}Disposed) return`,
    `      ${p}Disposed = true`,
    `      ${p}OwnerDocument.transaction(() => {`,
    ...guardedOperations(["this.remove()",
      ...(canInvalidate ? [`${p}OwnerDocument.cancelTask(${p}Task)`] : []), ...cancelPhases,
      ...(needsConnection ? [`${p}Connection.dispose()`] : []), ...cleanup,
      ...(hooks.fieldNames.length ? [`for (const field of ${p}FieldClass.#${p}HookFields) this[field] = undefined`] : []),
      `for (const [name, field] of ${p}InputFields) ${hasNativeInputs ? `if (!${p}NativeInputs.has(name)) ` : ""}this[field] = undefined`,
      ...(hasNativeInputs ? [`${p}NativeCommands?.clear()`] : []),
      ...(hasStyles ? [`${p}StyleLease?.release(); ${p}StyleLease = null`] : [])], `${p}Dispose`),
    `      })`,
    `    }`,
    `    try { this.update(initialProps, initialContent, initialContext) } catch (error) { this.dispose(); throw error }`,
    `  }`,
    `}`,
    ...(plan.defaultExport ? [`export default ${plan.name}`] : []),
  ]
  if (!needsConnection) {
    const start = lines.indexOf(`    const ${p}Connection = ${p}ObserveConnection(this, {`)
    const end = lines.findIndex((line, index) => index > start && line.startsWith("    Object.defineProperties(this,"))
    lines.splice(start, end - start)
  }
  if (!canInvalidate) {
    for (let index = lines.length - 1; index >= 0; index--) if (
      lines[index]!.startsWith(`    const ${p}Task = `) || lines[index]!.startsWith(`    const ${p}Invalidate = `) ||
      lines[index] === `      ${p}OwnerDocument.cancelTask(${p}Task)` ||
      lines[index] === `      if (${p}Forced) ${p}OwnerDocument.enqueueTask(${p}Task)`
    ) lines.splice(index, 1)
  }
  // Авторский body и default expressions не участвуют в переименовании служебных locals.
  // uniqueHelperPrefix уже гарантирует отсутствие этого префикса во всём исходнике.
  const locals = new Set(["inputs", "authoredProps", "previousInputs", "memoInputs", "nextContentInput", "nextRetainedContent", "previousContext", "previousSlotContent", "previousFocus", "phases", "nextProps", "nextContent", "nextContext", "initialProps", "initialContent", "initialContext"])
  return lines.map(line => {
    if (line === hooks.source || line === plan.slotBinding || plan.writes.includes(line)) return line
    const protectedParameter = line.startsWith(`        const ${parameter} = `) ? `        const ${parameter} = `.length : 0
    const scanner = createScanner(false, undefined, line)
    const edits: {start: number, end: number, text: string}[] = []
    for (let kind = scanner.scan(); kind !== SyntaxKind.EndOfFile; kind = scanner.scan()) {
      if (scanner.getTokenStart() < protectedParameter) continue
      const name = scanner.getTokenText()
      if ((kind === SyntaxKind.Identifier || kind === SyntaxKind.UndefinedKeyword) && name === "undefined") edits.push({start: scanner.getTokenStart(), end: scanner.getTokenEnd(), text: "(void 0)"})
      else if (kind === SyntaxKind.Identifier && locals.has(name)) edits.push({start: scanner.getTokenStart(), end: scanner.getTokenEnd(), text: `${p}Local_${name}`})
    }
    for (const edit of edits.reverse()) line = line.slice(0, edit.start) + edit.text + line.slice(edit.end)
    return plan.parameterDefault ? line.replaceAll(authoredDefault, plan.parameterDefault) : line
  }).join("\n")
}
