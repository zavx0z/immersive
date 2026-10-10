import type {JsxSourceRange} from "../contract/output.ts"

/** Общий текст импорта содержит только нижние DOM-операции и данные авторства. */
export function emitDomImports(prefix: string, publicRuntime: boolean, needsEnvironment = false): string {
  const source = publicRuntime ? "@zavx0z/immersive" : "@zavx0z/immersive-dom"
  const classes = ["DOMGroup", "Node", "DocumentFragment", "HTMLElement", "HTMLButtonElement", "HTMLDivElement", "HTMLFieldSetElement", "HTMLHeadingElement", "HTMLInputElement", "HTMLImageElement", "HTMLVideoElement", "HTMLLabelElement", "HTMLLIElement", "HTMLLegendElement", "HTMLMeterElement", "HTMLOptionElement", "HTMLParagraphElement", "HTMLProgressElement", "HTMLSelectElement", "HTMLSpanElement", "HTMLTableElement", "HTMLTableSectionElement", "HTMLTableCellElement", "HTMLTextAreaElement", "HTMLTableRowElement", "HTMLUListElement", "HTMLVectorPathElement"]
  const primitives = {
    domComponentConstructorBrand: "ConstructorBrand", observeConnection: "ObserveConnection",
    acquireDocumentCompiledStyleSheets: "AcquireStyles", prepareTextOperation: "PrepareText",
    prepareDomOperation: "PrepareProperty", propertyOperation: "Property", attributeOperation: "Attribute",
    textValue: "Text", styleOperation: "StyleOperation",
    hasPropertySetter: "HasSetter",
    nativePropertyForBinding: "NativeProperty",
    DomEventBinding: "EventBinding",
    replaceDomRangeContent: "ReplaceRange",
    captureDomOrigins: "CaptureOrigins", validateDomNodes: "ValidateNodes",
    retainDOMContent: "RetainContent",
    encodeCompiledStyleText: "EncodeStyle", decodeCompiledStyleText: "DecodeStyle",
  }
  const entries = [...classes.map(name => `${name} as ${prefix}${name}`), ...Object.entries(primitives).map(([name, alias]) => `${name} as ${prefix}${alias}`)]
  const spatial = ["SpaceElement", "ViewPointElement", "DisplayElement", "HUDElement"]
  const imports = [`import {${[...entries, ...(publicRuntime ? spatial.map(name => `${name} as ${prefix}${name}`) : [])].join(", ")}} from ${JSON.stringify(source)}`]
  if (!publicRuntime) for (const [name, subpath] of [["SpaceElement", "space"], ["ViewPointElement", "viewpoint"], ["DisplayElement", "display"], ["HUDElement", "hud"]]) imports.push(`import {${name} as ${prefix}${name}} from "@zavx0z/immersive-dom/${subpath}"`)
  if (needsEnvironment) imports.push(`import {documentEnvironment as ${prefix}GetEnvironment} from ${JSON.stringify(publicRuntime ? "@zavx0z/immersive" : "@zavx0z/immersive-browser")}`)
  return [...imports,
    `const ${prefix}SlotsKey = Symbol.for("@zavx0z/immersive-template/slot-contents")`,
    `const ${prefix}InstanceConstructor = Symbol()`,
    `const ${prefix}SameDeps = (a, b) => a !== undefined && b !== undefined && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))`,
    `const ${prefix}ReadContext = (frame, context) => { for (; frame; frame = frame.parent) if (frame.context === context) return frame.value; return context.defaultValue }`,
    ...(needsEnvironment ? [`const ${prefix}Environment = document => { const value = ${prefix}GetEnvironment(document); if (value === null) throw new Error("Browser hooks require a connected Document"); return value }`] : []),
    `const ${prefix}MergeContext = (parent, own) => own ? {context: own.context, value: own.value, parent: ${prefix}MergeContext(parent, own.parent)} : parent`,
    `const ${prefix}Component = (type, props, key = null, content) => ({type, props, key, content})`,
    `const ${prefix}CreateContext = defaultValue => Object.freeze({defaultValue})`,
    `const ${prefix}ProvideContext = (context, value, child) => ({...child, context: ${prefix}MergeContext({context, value, parent: null}, child.context)})`,
    `const ${prefix}When = (condition, type, props, key = null) => condition ? ${prefix}Component(type, props, key) : null`,
    `const ${prefix}Batch = (document, callback) => document.transaction(callback)`,
    `const ${prefix}HasSlot = (content, name, slots) => { if (typeof name !== "string") throw new TypeError("Slot name must be a string"); if (!slots.includes(name)) throw new TypeError("Unknown slot " + name); return ${prefix}Slot({content: content?.[name]}) !== null }`,
    `const ${prefix}Keyed = values => values`,
    `const ${prefix}FixedChildren = values => values`,
    `const ${prefix}Children = value => value ?? null`,
    `const ${prefix}Slot = ({content}) => { const present = value => value != null && typeof value !== "boolean" && value !== "" && (!Array.isArray(value) || value.some(present)); return present(content) ? content : null }`,
    `const ${prefix}StyleSheet = (id, encoded, source) => ({id, cssText: ${prefix}DecodeStyle(encoded), ...(source ? {source} : {})})`,
    `const ${prefix}AttachRef = (ref, target) => { if (ref == null) return null; if (typeof ref === "function") { const cleanup = ref(target); return typeof cleanup === "function" ? cleanup : () => ref(null) } ref.current = target; return () => { if (ref.current === target) ref.current = null } }`,
    `const ${prefix}ShallowProps = (a, b) => { if (Object.is(a, b)) return true; if (!a || !b || Reflect.ownKeys(a).length !== Reflect.ownKeys(b).length) return false; return Reflect.ownKeys(a).every(key => Object.prototype.hasOwnProperty.call(b, key) && Object.is(a[key], b[key])) }`,
    `const ${prefix}Memo = (type, compare = ${prefix}ShallowProps) => class extends type { static memoCompare = compare }`,
  ].join("\n").replace(/\bundefined\b/g, "(void 0)") + "\n"
}

/** Оставляет только используемые конкретным модулем primitives и чистые author data helpers. */
export function pruneDomImports(source: string, prefix: string, onSourceRanges?: (ranges: readonly JsxSourceRange[]) => void): string {
  const lines = source.split("\n")
  const helpers = new Map<string, string>()
  const helperPattern = new RegExp(`^const (${prefix}(?:InstanceConstructor|SlotsKey|SameDeps|ReadContext|Environment|MergeContext|Component|CreateContext|ProvideContext|When|Batch|HasSlot|Keyed|FixedChildren|Children|Slot|StyleSheet|AttachRef|ShallowProps|Memo)) = `)
  const imports = new Set<string>()
  for (const line of lines) {
    const helper = helperPattern.exec(line)?.[1]
    if (helper) helpers.set(helper, line)
    else if (line.startsWith("import {") && line.includes(` as ${prefix}`)) imports.add(line)
  }
  const identifiers = (text: string): Set<string> => {
    return new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? [])
  }
  const body = lines.filter(line => !imports.has(line) && !helperPattern.test(line)).join("\n")
  const used = identifiers(body)
  const pending = [...used]
  for (let index = 0; index < pending.length; index++) {
    const helper = helpers.get(pending[index]!)
    if (!helper) continue
    for (const dependency of identifiers(helper)) if (!used.has(dependency)) { used.add(dependency); pending.push(dependency) }
  }
  const retained = lines.map(line => {
    const helper = helperPattern.exec(line)?.[1]
    if (helper) return used.has(helper) ? line : null
    if (!imports.has(line)) return line
    const end = line.indexOf("} from ")
    const bindings = line.slice(8, end).split(", ").filter(binding => used.has(binding.split(" as ").at(-1)!))
    return bindings.length ? `import {${bindings.join(", ")}${line.slice(end)}` : null
  })
  if (onSourceRanges !== undefined) {
    const ranges: JsxSourceRange[] = []
    let sourceStart = 0
    let generatedStart = 0
    let first = true
    for (const [index, line] of lines.entries()) {
      const output = retained[index]
      if (output !== null && output !== undefined) {
        if (!first) generatedStart++
        if (output === line && line.length > 0) ranges.push({generatedStart, generatedEnd: generatedStart + line.length, sourceStart})
        generatedStart += output.length
        first = false
      }
      sourceStart += line.length + 1
    }
    onSourceRanges(ranges)
  }
  return retained.filter(line => line !== null).join("\n")
}
