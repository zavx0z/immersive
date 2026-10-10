import type {
  ArrowFunction,
  CallExpression,
  Expression,
  FunctionDeclaration,
  Identifier,
  JsxAttribute,
  JsxChild,
  JsxElement,
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
  ParenthesizedExpression,
  ReturnStatement,
  SourceFile,
  TaggedTemplateExpression,
} from "typescript/unstable/ast"
import {createHash} from "node:crypto"
import {NodeFlags, SyntaxKind} from "typescript/unstable/ast"
import {
  isArrowFunction,
  isBlock,
  isCallExpression,
  isObjectLiteralExpression,
  isObjectBindingPattern,
  isPropertyAssignment,
  isClassDeclaration,
  isBinaryExpression,
  isConditionalExpression,
  isDoStatement,
  isElementAccessExpression,
  isExportDeclaration,
  isExternalModuleReference,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isFunctionLikeDeclaration,
  isIdentifier,
  isIfStatement,
  isImportDeclaration,
  isImportEqualsDeclaration,
  isJsxAttribute,
  isJsxElement,
  isJsxExpression,
  isJsxFragment,
  isJsxSelfClosingElement,
  isJsxSpreadAttribute,
  isJsxText,
  isNamedImports,
  isNoSubstitutionTemplateLiteral,
  isNullLiteral,
  isParenthesizedExpression,
  isPostfixUnaryExpression,
  isPrefixUnaryExpression,
  isPropertyAccessExpression,
  isReturnStatement,
  isStringLiteral,
  isSwitchStatement,
  isTaggedTemplateExpression,
  isTrueLiteral,
  isFalseLiteral,
  isNumericLiteral,
  isTemplateExpression,
  isTryStatement,
  isTypeNode,
  isVariableDeclaration,
  isVariableDeclarationList,
  isVariableStatement,
  isWhileStatement,
  isWithStatement,
  isAssignmentOperator,
  skipOuterExpressions,
} from "typescript/unstable/ast/is"
import JsxCompileError from "@zavx0z/immersive-jsx-compiler-error"
import {
  hostAttributeTransport,
  hostAttributeValue,
} from "./host-profile.ts"
import {
  extractComponentStyle,
  extractCompiledStyle,
  type CompiledCssTemplateSource,
  type CompiledStyleFragment,
  type JsxStylePrimitiveKind,
} from "./style.ts"
import {parseCssTemplateShape} from "@zavx0z/immersive-template/css-shape"
import planSlots from "@zavx0z/immersive-jsx-slot-plan"
import SlotAuthoring from "@zavx0z/immersive-jsx-slot-authoring"
import {emitDomComponent, type DirectBinding} from "./dom-codegen.ts"
import {lowerHooks} from "./hook-lowering.ts"
import {emitDomImports, pruneDomImports} from "./dom-imports.ts"
import {emitCustomHook} from "./hook-codegen.ts"
import {componentReturn, getAuthoringDeclarations} from "./source-profile.ts"
import type {JsxSourceRange} from "../contract/output.ts"
import {composeSourceRanges, sourceRangesForEdits, type SourceRangeEdit} from "./source-ranges.ts"

type Edit = SourceRangeEdit

type PropsBindings = Readonly<{
  object: number | null
  destructured: ReadonlyMap<number, string>
}>

type CompileContext = {
  readonly standalonePropsSpread?: boolean
  readonly componentSlots: ReadonlyMap<number, readonly string[]>
  readonly slotProps: string | null
  readonly componentName: string
  readonly components: ReadonlySet<number>
  readonly consumedCss: Set<Node>
  readonly consumedJsx: Set<Node>
  readonly cssTagSymbols: ReadonlySet<number>
  readonly cssTemplates: ReadonlyMap<number, TaggedTemplateExpression>
  readonly cssTemplateReferences: Map<number, Set<Node>>
  readonly cssTemplateSites: Map<number, Set<Node>>
  readonly childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>
  readonly jsxOrigins: JsxTransformSymbols["jsxOrigins"]
  readonly helper: string
  readonly propsBindings: PropsBindings
  readonly source: string
  readonly sourceFile: SourceFile
  readonly sourcePath: string
  readonly sourceIdentity: string
  readonly styleSourceModuleId: string | null
  readonly stylePrimitiveKinds: ReadonlyMap<Node, JsxStylePrimitiveKind>
  readonly symbols: ReadonlyMap<Node, number>
  readonly unstableStyleSymbols: ReadonlySet<number>
  readonly arrayExpressions: ReadonlySet<Node>
  readonly mount: string[]
  readonly bindings: DirectBinding[]
  readonly styleFragments: CompiledStyleFragment[]
  readonly writes: string[]
  nodeIndex: number
}

type ComponentExpression = Readonly<{
  expression: string
  key: string
  props: string
  template: string
  content: string
  mergedProps?: boolean
}>

type ComponentExpressionContext = Readonly<{
  standalonePropsSpread?: boolean
  componentSlots: ReadonlyMap<number, readonly string[]>
  slotProps: string | null
  arrayExpressions: ReadonlySet<Node>
  childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>
  jsxOrigins: ReadonlyMap<Node, readonly import("@zavx0z/immersive-jsx-slot-authoring").JsxOrigin[]>
  components: ReadonlySet<number>
  consumedCss: Set<Node>
  consumedJsx: Set<Node>
  cssTagSymbols: ReadonlySet<number>
  cssTemplates: ReadonlyMap<number, TaggedTemplateExpression>
  cssTemplateReferences: Map<number, Set<Node>>
  cssTemplateSites: Map<number, Set<Node>>
  helper: string
  propsBindings: PropsBindings
  sourceFile: SourceFile
  sourcePath: string
  stylePrimitiveKinds: ReadonlyMap<Node, JsxStylePrimitiveKind>
  symbols: ReadonlyMap<Node, number>
}>

type RuntimeImportBindings = Readonly<{
  css: ReadonlySet<number>
  createRoot: ReadonlySet<number>
  browserCreateRoot: ReadonlySet<number>
  hooks: ReadonlyMap<number, Readonly<{name: string; supported: boolean}>>
  memo: ReadonlySet<number>
}>

const supportedHooks = Object.freeze([
  "useDocument",
  "useCallback",
  "useContext",
  "useDebugValue",
  "useEffect",
  "useEffectEvent",
  "useId",
  "useImperativeHandle",
  "useInsertionEffect",
  "useLayoutEffect",
  "useMemo",
  "useReducer",
  "useRef",
  "useState",
  "useSyncExternalStore",
  "useFrame",
  "useSpace",
] as const)

export const jsxAuthoringProfile = Object.freeze({
  componentChildren: Object.freeze({
    arbitraryArrays: false,
    destructuredParameter: true,
    explicitChildrenAttribute: false,
    fragments: false,
    intrinsicElements: false,
    keyedComponents: true,
    nullableComponent: true,
    primitiveText: true,
    receiver: "props.children" as const,
    singleComponent: true,
  }),
  customHooks: true,
  sourceMaps: false,
  styles: Object.freeze({
    baseDeclarations: "direct-only" as const,
    cssTaggedTemplates: true,
    componentLocalObjects: false,
    conditionalStaticFragments: "nested-css" as const,
    globalCssIntrinsic: true,
    componentStyleProps: "base-only-inline" as const,
    dynamicBaseDeclarations: "inline-binding" as const,
    dynamicPseudos: false,
    destructuredStyleProp: true,
    privateCssConstants: "reuse-only" as const,
    redundantBaseSelector: false,
    scopedCssSelectors: "owner-and-pseudos" as const,
    scopedAttributeSelectors: true,
    staticPseudos: Object.freeze([
      ":active",
      ":checked",
      ":disabled",
      ":focus",
      ":focus-within",
      ":hover",
      ":indeterminate",
    ] as const),
  }),
  supportedHooks,
})

const supportedHookNames: ReadonlySet<string> = new Set(supportedHooks)

export type JsxTransformSymbols = Readonly<{
  componentSlots: ReadonlyMap<number, readonly string[]>
  arrayExpressions: ReadonlySet<Node>
  byNode: ReadonlyMap<Node, number>
  childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>
  jsxOrigins: ReadonlyMap<Node, readonly import("@zavx0z/immersive-jsx-slot-authoring").JsxOrigin[]>
  cssIntrinsicSymbols: ReadonlySet<number>
  dependencyPaths: ReadonlySet<string>
  documentSymbols: ReadonlySet<number>
  importedComponents: ReadonlySet<number>
  importedCustomHooks: ReadonlySet<number>
  sourceIdentity: string
  stylePrimitiveKinds: ReadonlyMap<Node, JsxStylePrimitiveKind>
}>

export type JsxChildrenExpressionKind =
  | "empty"
  | "component-children"
  | "component"
  | "keyed-components"
  | "nullable-component"
  | "compiled-component"
  | "prepared-content"
  | "invalid-compiled-component"
  | "text"
  | "unsupported"

export type JsxTransformOptions = Readonly<{
  styleSourceModuleId?: string
  jsxImportSource?: string
  onSourceRanges?: (ranges: readonly JsxSourceRange[]) => void
}>

/** Lowers the bounded component TSX profile into the shared compiled-template ABI. */
export function transformJsxSourceFile(
  sourceFile: SourceFile,
  symbols: JsxTransformSymbols,
  options: JsxTransformOptions = {},
): string {
  const source = sourceFile.text
  const sourcePath = sourceFile.fileName
  const publicRuntime = options.jsxImportSource === "@zavx0z/immersive/XReact"
  const componentRuntime = publicRuntime ? "@zavx0z/immersive/XReact" : "@zavx0z/immersive-component"
  const compiledRuntime = publicRuntime ? "@zavx0z/immersive/XReact/compiled" : "@zavx0z/immersive-template/compiled"
  const slotRuntime = publicRuntime ? "@zavx0z/immersive/XReact/slot" : "@zavx0z/immersive-component/slot"
  const styleSourceModuleId = normalizedStyleSourceModuleId(options.styleSourceModuleId)
  const helper = uniqueHelperPrefix(source)
  const edits: Edit[] = []
  const presenceAliases: string[] = []
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier) ||
      !["@zavx0z/immersive-component/slot-presence", "@zavx0z/immersive/XReact/slot-presence", "@zavx0z/immersive-component/authoring", "@zavx0z/immersive/XReact"].includes(statement.moduleSpecifier.text)) continue
    const named = statement.importClause?.namedBindings
    if (statement.importClause?.phaseModifier !== SyntaxKind.TypeKeyword && statement.moduleSpecifier.text.endsWith("/slot-presence") && statement.importClause?.name) presenceAliases.push(statement.importClause.name.text)
    if (named && isNamedImports(named)) for (const specifier of named.elements) if (!specifier.isTypeOnly && (specifier.propertyName?.text ?? specifier.name.text) === "hasSlot") presenceAliases.push(specifier.name.text)
  }
  const runtimeBindings = runtimeImportBindings(
    sourceFile,
    symbols.byNode,
    symbols.cssIntrinsicSymbols,
    sourcePath,
  )
  const cssTemplates = collectCssTemplateConstants(
    sourceFile,
    runtimeBindings.css,
    symbols.byNode,
    sourcePath,
  )
  const cssTemplateReferences = new Map<number, Set<Node>>()
  const cssTemplateSites = new Map<number, Set<Node>>()
  const {components: componentDeclarations, hooks: customHookDeclarations} = getAuthoringDeclarations(sourceFile)
  const documentOwners = new Set([...componentDeclarations, ...customHookDeclarations].filter(declaration => {
    let usesDocument = false
    if (!declaration.body) return false
    visit(declaration.body, node => {
      if (isIdentifier(node) && symbols.documentSymbols.has(symbolId(symbols.byNode, node) ?? -1)) usesDocument = true
      if (isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
        const assigned = skipParentheses(node.left)
        if (isIdentifier(assigned) && symbols.documentSymbols.has(symbolId(symbols.byNode, assigned) ?? -1)) {
          throw compileError(sourcePath, "application document cannot be reassigned")
        }
      }
    })
    for (const parameter of declaration.parameters) visit(parameter, node => {
      if (isIdentifier(node) && symbols.documentSymbols.has(symbolId(symbols.byNode, node) ?? -1)) {
        throw compileError(sourcePath, "application document must be read inside the component or hook body")
      }
    })
    return usesDocument
  }))
  const consumedCss = new Set<Node>()
  const consumedJsx = new Set<Node>()
  let needsCompiledRuntime = false
  const componentSymbols = new Set(symbols.importedComponents)
  const componentSlots = new Map(symbols.componentSlots)
  const customHookSymbols = new Set(symbols.importedCustomHooks)
  for (const declaration of componentDeclarations) {
    const id = symbolId(symbols.byNode, declaration.name!)
    if (id !== null) componentSymbols.add(id)
  }
  for (const declaration of componentDeclarations) {
    const id = symbolId(symbols.byNode, declaration.name!)
    if (id === null) continue
    const declarations = sourceFile.statements.filter(statement =>
      isFunctionDeclaration(statement) && statement.name !== undefined &&
      symbolId(symbols.byNode, statement.name) === id)
    if (declarations.length !== 1) {
      throw compileError(sourcePath, `${declaration.name!.text} overloads are unsupported`)
    }
  }
  for (const declaration of customHookDeclarations) {
    const id = symbolId(symbols.byNode, declaration.name!)
    if (id !== null) customHookSymbols.add(id)
  }

  for (const statement of sourceFile.statements) {
    if (!isVariableStatement(statement)) continue
    if ((statement.declarationList.flags & NodeFlags.Const) === 0) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!isVariableDeclaration(declaration) || !isIdentifier(declaration.name)) continue
      const initializer = declaration.initializer
      if (
        initializer && isCallExpression(initializer) && isIdentifier(initializer.expression) &&
        runtimeBindings.memo.has(symbolId(symbols.byNode, initializer.expression) ?? -1) &&
        initializer.arguments.length >= 1 && initializer.arguments.length <= 2 &&
        isIdentifier(initializer.arguments[0]!) &&
        componentSymbols.has(symbolId(symbols.byNode, initializer.arguments[0]!) ?? -1)
      ) {
        const id = symbolId(symbols.byNode, declaration.name)
        if (id !== null) {
          componentSymbols.add(id)
          const slots = componentSlots.get(symbolId(symbols.byNode, initializer.arguments[0]!) ?? -1)
          if (slots) componentSlots.set(id, slots)
        }
      }
    }
  }
  assertNoReactRuntimeReferences(sourceFile, sourcePath)
  assertNoSymbolWrites(sourceFile, componentSymbols, symbols.byNode, sourcePath)
  for (const declaration of customHookDeclarations) {
    const name = declaration.name!.text
    const modifiers = declaration.modifiers?.map(modifier => modifier.getText(sourceFile)) ?? []
    if (!declaration.body || !isBlock(declaration.body) || declaration.asteriskToken ||
      modifiers.includes("async")) {
      throw compileError(sourcePath, `${name} must be a synchronous governed custom hook`)
    }
  }
  validateHookCalls(
    sourceFile,
    new Set([...componentDeclarations, ...customHookDeclarations]),
    runtimeBindings.hooks,
    customHookSymbols,
    symbols.byNode,
    sourcePath,
  )

  for (const declaration of componentDeclarations) {
    needsCompiledRuntime = true
    edits.push({
      start: declaration.getStart(sourceFile),
      end: declaration.getEnd(),
      text: compileComponent(
        declaration,
        componentSymbols,
        helper,
        sourceFile,
        symbols.byNode,
        symbols.arrayExpressions,
        symbols.childrenExpressionKinds,
        symbols.jsxOrigins,
        symbols.sourceIdentity,
        styleSourceModuleId,
        symbols.stylePrimitiveKinds,
        runtimeBindings.css,
        cssTemplates,
        cssTemplateReferences,
        cssTemplateSites,
        consumedCss,
        consumedJsx,
        documentOwners.has(declaration),
        componentSlots,
        runtimeBindings.hooks,
        customHookSymbols,
        presenceAliases,
      ),
    })
  }

  for (const declaration of customHookDeclarations) {
    edits.push({start: declaration.getStart(sourceFile), end: declaration.getEnd(), text: emitCustomHook(declaration, sourceFile, helper, runtimeBindings.hooks, customHookSymbols, symbols.byNode, presenceAliases)})
  }

  const componentRanges = [...componentDeclarations, ...customHookDeclarations].map((declaration) => ({
    start: declaration.getStart(sourceFile),
    end: declaration.getEnd(),
  }))
  for (const statement of removableCssTemplateStatements(
    sourceFile,
    runtimeBindings.css,
    symbols.byNode,
    consumedCss,
  )) {
    edits.push({start: statement.getStart(sourceFile), end: statement.getEnd(), text: ""})
  }
  const componentRoots = componentRootBindings(
    sourceFile,
    runtimeBindings.createRoot,
    symbols.byNode,
  )
  const browserRoots = componentRootBindings(sourceFile, runtimeBindings.browserCreateRoot, symbols.byNode)
  visit(sourceFile, (node) => {
    if (!isCallExpression(node)) return
    if (!isPropertyAccessExpression(node.expression)) return
    if (node.expression.name.text !== "render" || node.arguments.length !== 1) return
    if (!isComponentRootExpression(
      node.expression.expression,
      componentRoots,
      runtimeBindings.createRoot,
      symbols.byNode,
    )) return
    const start = node.getStart(sourceFile)
    if (componentRanges.some((range) => start >= range.start && start < range.end)) return
    const argument = skipParentheses(node.arguments[0]!)
    if (!isJsxElement(argument) && !isJsxSelfClosingElement(argument)) return
    const compiled = componentExpression(argument, {
      standalonePropsSpread: true,
      componentSlots,
      slotProps: null,
      arrayExpressions: symbols.arrayExpressions,
      childrenExpressionKinds: symbols.childrenExpressionKinds, jsxOrigins: symbols.jsxOrigins,
      components: componentSymbols,
      consumedJsx,
      consumedCss,
      cssTagSymbols: runtimeBindings.css,
      cssTemplates,
      cssTemplateReferences,
      cssTemplateSites,
      helper,
      propsBindings: {object: null, destructured: new Map()},
      sourceFile,
      sourcePath,
      stylePrimitiveKinds: symbols.stylePrimitiveKinds,
      symbols: symbols.byNode,
    })
    needsCompiledRuntime = true
    const receiver = node.expression.expression
    const receiverText = receiver.getText(sourceFile)
    const calleeText = `${receiverText}.render`
    edits.push({
      start,
      end: node.getEnd(),
      copies: node.expression.getText(sourceFile) === calleeText ? [
        {generatedStart: 0, generatedEnd: calleeText.length, sourceStart: node.expression.getStart(sourceFile)},
      ] : [
        {generatedStart: 0, generatedEnd: receiverText.length, sourceStart: receiver.getStart(sourceFile)},
        {generatedStart: receiverText.length + 1, generatedEnd: calleeText.length, sourceStart: node.expression.name.getStart(sourceFile)},
      ],
      text: compiled.mergedProps || isComponentRootExpression(node.expression.expression, browserRoots, runtimeBindings.browserCreateRoot, symbols.byNode)
        ? `${node.expression.expression.getText(sourceFile)}.render(${compiled.expression})`
        : `${node.expression.expression.getText(sourceFile)}.render(${compiled.template}, ${compiled.props}${compiled.key === "null" && compiled.content === "undefined" ? "" : `, {key: ${compiled.key}, content: ${compiled.content}}`})`,
    })
  })

  visit(sourceFile, node => {
    if ((!isJsxElement(node) && !isJsxSelfClosingElement(node) && !isJsxFragment(node)) || consumedJsx.has(node)) return
    const expressionContext: ComponentExpressionContext = {
      standalonePropsSpread: true,
      componentSlots, slotProps: null, arrayExpressions: symbols.arrayExpressions,
      childrenExpressionKinds: symbols.childrenExpressionKinds, jsxOrigins: symbols.jsxOrigins, components: componentSymbols,
      consumedJsx, consumedCss, cssTagSymbols: runtimeBindings.css, cssTemplates,
      cssTemplateReferences, cssTemplateSites, helper, propsBindings: {object: null, destructured: new Map()},
      sourceFile, sourcePath, stylePrimitiveKinds: symbols.stylePrimitiveKinds, symbols: symbols.byNode,
    }
    const opening = isJsxElement(node) ? node.openingElement : isJsxSelfClosingElement(node) ? node : null
    let output: string
    if (opening && /^[A-Z]/.test(opening.tagName.getText(sourceFile))) output = componentExpression(node as JsxElement | JsxSelfClosingElement, expressionContext, [...symbols.jsxOrigins.values()].some(origins => origins.includes(node as never))).expression
    else {
      const name = `${helper}Expression${node.getStart(sourceFile)}`
      const context: CompileContext = {
        ...expressionContext, componentName: name, source, sourceIdentity: symbols.sourceIdentity,
        styleSourceModuleId, unstableStyleSymbols: new Set(), mount: [], bindings: [], styleFragments: [], writes: [], nodeIndex: 0,
      }
      const roots = compileJsx(node, context)
      const captures: string[] = []
      const parameter = `${helper}ExpressionProps`
      const writes = context.writes.map((write, index) => {
        const assignment = write.indexOf(" = ")
        const target = write.slice(0, assignment)
        captures.push(`${JSON.stringify(`value${index}`)}: (${write.slice(assignment + 3)})`)
        return `${target} = ${parameter}[${JSON.stringify(`value${index}`)}]`
      })
      const type = emitDomComponent({
        name, exported: false, defaultExport: false, parameter, parameterDefault: null,
        slotParameter: null, slotBinding: "", slots: [], rootTag: opening?.tagName.getText(sourceFile) ?? null,
        sourceIdentity: symbols.sourceIdentity, helper, presenceAliases: [], mount: context.mount, roots,
        bindings: context.bindings, writes, styleSheets: componentStyleSheets(context),
        hooks: {source: "", fields: [], commit: [], refs: [], insertion: [], layout: [], passive: [], disconnect: [], checks: [], memoChecks: [], adopt: [], dispose: []},
      })
      output = `${helper}Component((${type}), {${captures.join(", ")}})`
    }
    needsCompiledRuntime = true
    edits.push({start: node.getStart(sourceFile), end: node.getEnd(), text: output})
  })

  assertCanonicalCssTemplateReuse(
    sourceFile,
    cssTemplates,
    cssTemplateReferences,
    cssTemplateSites,
    symbols.byNode,
    sourcePath,
  )

  const declaredCssTemplates = new Set(cssTemplates.values())
  visit(sourceFile, node => {
    if (!isTaggedTemplateExpression(node) ||
      !isExactCssTag(node, runtimeBindings.css, symbols.byNode)) return
    if (consumedCss.has(node) || declaredCssTemplates.has(node)) return
    throw compileError(
      sourcePath,
      "css templates are supported only by an intrinsic style or same-module const attached there",
    )
  })

  const helperAuthorImports = sourceFile.statements.some(statement => {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier) ||
      !["@zavx0z/immersive-component", "@zavx0z/immersive-component/authoring", "@zavx0z/immersive/XReact", "@zavx0z/immersive-component/slot", "@zavx0z/immersive/XReact/slot"].includes(statement.moduleSpecifier.text) ||
      statement.importClause?.phaseModifier === SyntaxKind.TypeKeyword) return false
    const named = statement.importClause?.namedBindings
    if (statement.moduleSpecifier.text.endsWith("/slot") && statement.importClause?.name) return true
    return named && isNamedImports(named) && named.elements.some(specifier => !specifier.isTypeOnly &&
      ["component", "createContext", "provideContext", "memo", "fixedChildren", "normalizeChildren", "keyedComponents", "when", "batch", "composeSlot"].includes(specifier.propertyName?.text ?? specifier.name.text))
  })
  if (needsCompiledRuntime || customHookDeclarations.length > 0 || helperAuthorImports) {
    edits.push({start: importInsertionOffset(source), end: importInsertionOffset(source), text: emitDomImports(helper, publicRuntime, [...runtimeBindings.hooks.values()].some(hook => hook.name === "useFrame" || hook.name === "useSpace"))})
  }
  const authorNames = new Map<string, string>([["component", "Component"], ["createContext", "CreateContext"], ["provideContext", "ProvideContext"], ["memo", "Memo"], ["fixedChildren", "FixedChildren"], ["normalizeChildren", "Children"], ["keyedComponents", "Keyed"], ["when", "When"], ["batch", "Batch"], ["composeSlot", "Slot"]])
  const authorModules = new Set(["@zavx0z/immersive-component", "@zavx0z/immersive-component/authoring", "@zavx0z/immersive/XReact"])
  for (const statement of sourceFile.statements) {
    if (isImportDeclaration(statement) && isStringLiteral(statement.moduleSpecifier) &&
      ["@zavx0z/immersive/XReact/browser", "@zavx0z/immersive/XReact/browser/integration", "@zavx0z/immersive-browser", "@zavx0z/immersive-browser/integration", "@zavx0z/immersive-browser/authoring"].includes(statement.moduleSpecifier.text) && statement.importClause?.phaseModifier !== SyntaxKind.TypeKeyword) {
      const named = statement.importClause?.namedBindings
      if (named && isNamedImports(named)) {
        const retained = named.elements.filter(specifier => specifier.isTypeOnly || !["useSpace", "useFrame"].includes(specifier.propertyName?.text ?? specifier.name.text))
        const browserModule = publicRuntime ? "@zavx0z/immersive" : "@zavx0z/immersive-browser"
        edits.push({start: statement.getStart(sourceFile), end: statement.getEnd(), text: retained.length ? `import {${retained.map(specifier => specifier.getText(sourceFile)).join(", ")}} from ${JSON.stringify(browserModule)}` : ""})
      }
      continue
    }
    if (isImportDeclaration(statement) && isStringLiteral(statement.moduleSpecifier) &&
      ["@zavx0z/immersive-component/slot", "@zavx0z/immersive/XReact/slot", "@zavx0z/immersive-component/slot-presence", "@zavx0z/immersive/XReact/slot-presence"].includes(statement.moduleSpecifier.text) && statement.importClause?.phaseModifier !== SyntaxKind.TypeKeyword) {
      const named = statement.importClause?.namedBindings
      const defaultName = statement.importClause?.name
      if (defaultName && statement.moduleSpecifier.text.endsWith("/slot")) edits.push({start: importInsertionOffset(source), end: importInsertionOffset(source), text: `const ${defaultName.text} = ${helper}Slot\n`})
      if (defaultName || named && isNamedImports(named)) {
        const retained = []
        for (const specifier of named && isNamedImports(named) ? named.elements : []) {
          const imported = specifier.propertyName?.text ?? specifier.name.text
          if (specifier.isTypeOnly) retained.push(specifier.getText(sourceFile))
          else if (imported === "composeSlot") edits.push({start: importInsertionOffset(source), end: importInsertionOffset(source), text: `const ${specifier.name.text} = ${helper}Slot\n`})
          else if (imported !== "hasSlot") retained.push(specifier.getText(sourceFile))
        }
        edits.push({start: statement.getStart(sourceFile), end: statement.getEnd(), text: retained.length ? `import {${retained.join(", ")}} from ${statement.moduleSpecifier.getText(sourceFile)}` : ""})
      }
      continue
    }
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier) || !authorModules.has(statement.moduleSpecifier.text)) continue
    const clause = statement.importClause
    if (clause?.phaseModifier === SyntaxKind.TypeKeyword) continue
    const named = clause?.namedBindings
    if (!named || !isNamedImports(named)) continue
    const retained = []
    for (const specifier of named.elements) {
      const imported = specifier.propertyName?.text ?? specifier.name.text
      const replacement = authorNames.get(imported)
      if (specifier.isTypeOnly) { retained.push(specifier.getText(sourceFile)); continue }
      if (imported === "hasSlot") continue
      if (imported === "createRoot") {
        edits.push({start: importInsertionOffset(source), end: importInsertionOffset(source), text: `import {createDomRoot as ${specifier.name.text}} from ${JSON.stringify(publicRuntime ? "@zavx0z/immersive" : "@zavx0z/immersive-dom")}\n`})
        continue
      }
      if (!replacement && !supportedHookNames.has(imported)) retained.push(specifier.getText(sourceFile))
      if (replacement) edits.push({start: importInsertionOffset(source), end: importInsertionOffset(source), text: `const ${specifier.name.text} = ${helper}${replacement}\n`})
    }
    edits.push({start: statement.getStart(sourceFile), end: statement.getEnd(), text: retained.length ? `import {${retained.join(", ")}} from ${statement.moduleSpecifier.getText(sourceFile)}` : ""})
  }

  const code = applyEdits(source, edits, sourcePath, helper)
  const ranges = options.onSourceRanges === undefined ? undefined : sourceRangesForEdits(source.length, edits.map(edit => ({...edit, text: edit.text.replaceAll("__COMPONENT_HELPER__", `${helper}Component`)})))
  return pruneDomImports(code, helper, ranges === undefined ? undefined : pruned => options.onSourceRanges!(composeSourceRanges(pruned, ranges)))
}

function compileComponent(
  declaration: FunctionDeclaration,
  components: ReadonlySet<number>,
  helper: string,
  sourceFile: SourceFile,
  symbols: ReadonlyMap<Node, number>,
  arrayExpressions: ReadonlySet<Node>,
  childrenExpressionKinds: ReadonlyMap<Node, JsxChildrenExpressionKind>,
  jsxOrigins: JsxTransformSymbols["jsxOrigins"],
  sourceIdentity: string,
  styleSourceModuleId: string | null,
  stylePrimitiveKinds: ReadonlyMap<Node, JsxStylePrimitiveKind>,
  cssTagSymbols: ReadonlySet<number>,
  cssTemplates: ReadonlyMap<number, TaggedTemplateExpression>,
  cssTemplateReferences: Map<number, Set<Node>>,
  cssTemplateSites: Map<number, Set<Node>>,
  consumedCss: Set<Node>,
  consumedJsx: Set<Node>,
  ownsDocument: boolean,
  componentSlots: ReadonlyMap<number, readonly string[]>,
  hooks: RuntimeImportBindings["hooks"],
  customHooks: ReadonlySet<number>,
  presenceAliases: readonly string[],
): string {
  const name = declaration.name!.text
  const body = declaration.body
  if (!body || !isBlock(body)) throw compileError(sourceFile.fileName, `${name} requires a block body`)
  if (declaration.asteriskToken) throw compileError(sourceFile.fileName, `${name} cannot be a generator`)
  const modifiers = declaration.modifiers?.map(modifier => modifier.getText(sourceFile)) ?? []
  if (modifiers.includes("async")) {
    throw compileError(sourceFile.fileName, `${name} async components are unsupported`)
  }
  if (declaration.parameters.length > 1) {
    throw compileError(sourceFile.fileName, `${name} accepts at most one props parameter`)
  }
  if (declaration.typeParameters && declaration.typeParameters.length > 0) {
    throw compileError(sourceFile.fileName, `${name} generic components are unsupported`)
  }
  if (declaration.parameters[0]?.dotDotDotToken) {
    throw compileError(sourceFile.fileName, `${name} rest props are unsupported`)
  }
  const returned = componentReturn(declaration)
  if (!returned?.expression) throw compileError(sourceFile.fileName, `${name} requires one final JSX return`)
  assertSingleReturnPath(declaration, returned, sourceFile.fileName)
  const parameterDeclaration = declaration.parameters[0]
  const parameter = parameterDeclaration ? `${parameterDeclaration.name.getText(sourceFile)}${parameterDeclaration.type ? `: ${parameterDeclaration.type.getText(sourceFile)}` : ""}` : "_props: Record<string, never>"
  const slots = new SlotAuthoring(sourceFile).outlets(declaration)
  const slotProps = slots.length > 0 ? `${helper}SlotProps` : null
  const authoredParameter = declaration.parameters[0]
  const slotBinding = slotProps && authoredParameter
    ? `\n    const ${authoredParameter.name.getText(sourceFile)}${authoredParameter.type ? `: ${authoredParameter.type.getText(sourceFile)}` : ""} = ${slotProps}${authoredParameter.initializer ? ` ?? (${authoredParameter.initializer.getText(sourceFile)})` : ""}\n`
    : ""
  const prelude = sourceFile.text.slice(body.getStart(sourceFile) + 1, returned.getStart(sourceFile))
  const context: CompileContext = {
    componentSlots,
    slotProps,
    arrayExpressions,
    childrenExpressionKinds,
    jsxOrigins,
    componentName: name,
    components,
    consumedCss,
    consumedJsx,
    cssTagSymbols,
    cssTemplates,
    cssTemplateReferences,
    cssTemplateSites,
    helper,
    propsBindings: componentPropsBindings(declaration, symbols),
    source: sourceFile.text,
    sourceFile,
    sourcePath: sourceFile.fileName,
    sourceIdentity,
    styleSourceModuleId,
    stylePrimitiveKinds,
    symbols,
    unstableStyleSymbols: collectUnstableStyleSymbols(declaration, sourceFile, symbols),
    mount: [],
    bindings: [],
    styleFragments: [],
    writes: [],
    nodeIndex: 0,
  }
  const rootNodes = compileJsx(skipParentheses(returned.expression), context)
  const styleSheets = componentStyleSheets(context)
  const defaultExport = modifiers.includes("default")
  const rootExpression = skipParentheses(returned.expression)
  const opening = isJsxElement(rootExpression) ? rootExpression.openingElement : isJsxSelfClosingElement(rootExpression) ? rootExpression : null
  const rootTag = opening && /^[a-z]/.test(opening.tagName.getText(sourceFile)) && opening.tagName.getText(sourceFile) !== "slot" ? opening.tagName.getText(sourceFile) : null
  return emitDomComponent({
    name, exported: !defaultExport && modifiers.includes("export"), defaultExport,
    parameter, parameterDefault: parameterDeclaration?.initializer?.getText(sourceFile) ?? null, slotParameter: slotProps, slotBinding, slots, rootTag,
    sourceIdentity, helper, presenceAliases, inputNames: componentInputNames(declaration, context.propsBindings, symbols), mount: context.mount, roots: rootNodes,
    bindings: context.bindings, writes: context.writes, styleSheets,
    hooks: lowerHooks(declaration, sourceFile, body.getStart(sourceFile) + 1, returned.getStart(sourceFile), helper, hooks, customHooks, symbols),
  })
}

function compileJsx(expression: Expression, context: CompileContext): string[] {
  context.consumedJsx.add(expression)
  if (isJsxFragment(expression)) {
    return expression.children.flatMap(child => compileChild(child, context))
  }
  if (!isJsxElement(expression) && !isJsxSelfClosingElement(expression)) {
    throw compileError(context.sourcePath, "component return must be one JSX element")
  }
  const opening = isJsxElement(expression) ? expression.openingElement : expression
  const tag = opening.tagName.getText(context.sourceFile)
  if (tag === "slot") return compileSlotRange(expression as JsxElement | JsxSelfClosingElement, context)
  if (/^[a-z]/.test(tag)) return [compileIntrinsic(expression, opening, tag, context)]
  if (
    !isIdentifier(opening.tagName) ||
    !context.components.has(symbolId(context.symbols, opening.tagName) ?? -1)
  ) {
    throw compileError(context.sourcePath, `unknown or dynamic component ${tag}`)
  }
  return compileComponentRange(expression, "child", context)
}

function compileIntrinsic(
  expression: JsxElement | JsxSelfClosingElement,
  opening: JsxOpeningElement | JsxSelfClosingElement,
  tag: string,
  context: CompileContext,
): string {
  context.consumedJsx.add(expression)
  const variable = nextNode(context)
  context.mount.push(`const ${variable} = document.createElement(${JSON.stringify(tag)})`)
  for (const attribute of opening.attributes.properties) {
    if (isJsxSpreadAttribute(attribute)) {
      throw compileError(context.sourcePath, "JSX attribute spreads are unsupported")
    }
    if (!isJsxAttribute(attribute)) continue
    const name = attribute.name.getText(context.sourceFile)
    if (name === "key") throw compileError(context.sourcePath, "key is valid only on component children")
    if (name === "class" || name === "className") {
      throw compileError(
        context.sourcePath,
        "class-based component styling is unsupported; declare component-local rules through style",
      )
    }
    if (name === "dangerouslySetInnerHTML") {
      throw compileError(context.sourcePath, "dangerouslySetInnerHTML is unsupported")
    }
    if (name === "style" && compileStaticStyle(attribute, variable, context)) continue
    const value = hostAttributeValue(attribute, context.sourceFile)
    if (value === null) {
      throw compileError(context.sourcePath, `unsupported JSX attribute ${name}`)
    }
    const transport = hostAttributeTransport(name, value.transport)
    if (transport.kind === "unknown-event") {
      throw compileError(context.sourcePath, `unknown standard JSX event prop ${name}`)
    }
    const requiresBinding = transport.operation !== "mount"
    if (!requiresBinding && value.transport === "static") {
      if (value.staticValue === true) context.mount.push(`${variable}.setAttribute(${JSON.stringify(attributeName(name))}, "")`)
      else context.mount.push(`${variable}.setAttribute(${JSON.stringify(attributeName(name))}, ${JSON.stringify(value.staticValue)})`)
      continue
    }
    if ((transport.kind === "ref" || transport.kind === "event") &&
      value.transport === "static") {
      throw compileError(context.sourcePath, `${name} requires a JSX expression`)
    }
    const slot = context.bindings.length
    if (transport.kind === "style") context.bindings.push({kind: "style", target: variable})
    else if (transport.kind === "ref") context.bindings.push({kind: "ref", target: variable})
    else if (transport.kind === "event") {
      context.bindings.push({kind: "event", target: variable, type: transport.type, capture: transport.capture})
    } else {
      const initializer = attribute.initializer
      let authored = initializer && isJsxExpression(initializer) && initializer.expression ? skipOuterExpressions(initializer.expression) : null
      if (authored && isBinaryExpression(authored) && (
        authored.operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken && isTrueLiteral(skipOuterExpressions(authored.right)) ||
        authored.operatorToken.kind === SyntaxKind.QuestionQuestionToken && (
          isTrueLiteral(authored.right) || isFalseLiteral(authored.right) || isNumericLiteral(authored.right) || isStringLiteral(authored.right) || isNullLiteral(authored.right)
        )
      )) authored = skipOuterExpressions(authored.left)
      const input = authored && isPropertyAccessExpression(authored) && isIdentifier(authored.expression) &&
        symbolId(context.symbols, authored.expression) === context.propsBindings.object ? authored.name.text
        : authored && isIdentifier(authored) ? context.propsBindings.destructured.get(symbolId(context.symbols, authored) ?? -1) : undefined
      context.bindings.push({kind: "property", target: variable, name: attributeName(name), ...(input === undefined ? {} : {input})})
    }
    context.writes.push(`const ${context.helper}Next${slot} = ${value.expression}`)
  }

  const children = isJsxElement(expression) ? expression.children : []
  for (const child of children) {
    for (const childNode of compileChild(child, context)) context.mount.push(`${variable}.appendChild(${childNode})`)
  }
  return variable
}

function compileStaticStyle(
  attribute: JsxAttribute,
  target: string,
  context: CompileContext,
): boolean {
  const initializer = attribute.initializer
  if (!initializer || !isJsxExpression(initializer) || !initializer.expression) return false
  let fragmentPosition = 0
  const extraction = extractCompiledStyle(skipParentheses(initializer.expression), {
    nextIdentity(source) {
      const position = fragmentPosition
      fragmentPosition += 1
      const hash = createHash("sha256")
        .update(`${context.sourceIdentity}\0${context.componentName}\0${target}\0${position}\0${source}`)
        .digest("base64url")
        .slice(0, 16)
      return Object.freeze({
        attributeName: `data-z-${hash}` as const,
        id: `@zavx0z/immersive-template/style/${hash}`,
      })
    },
    primitiveKinds: context.stylePrimitiveKinds,
    isPassThrough: expression => isPropsFieldExpression(expression, "style", context),
    resolveCssTemplate: expression => resolveCompiledCssTemplate(expression, context, attribute),
    styleEncoder: `${context.helper}EncodeStyle`,
    sourceFile: context.sourceFile,
    sourcePath: context.sourcePath,
    symbols: context.symbols,
    unstableSymbols: context.unstableStyleSymbols,
  })
  for (const fragment of extraction.fragments) {
    if (context.styleFragments.some(current => current.attributeName === fragment.attributeName)) {
      throw compileError(context.sourcePath, `compiled style marker collision: ${fragment.attributeName}`)
    }
    context.styleFragments.push(fragment)
    if (fragment.condition === null) {
      context.mount.push(
        `${target}.setAttribute(${JSON.stringify(fragment.attributeName)}, "")`,
      )
      continue
    }
    const slot = context.bindings.length
    context.bindings.push({kind: "property", target, name: fragment.attributeName})
    context.writes.push(
      `const ${context.helper}Next${slot} = Boolean(${fragment.condition})`,
    )
  }
  if (extraction.residualExpression !== null) {
    const slot = context.bindings.length
    context.bindings.push({kind: "style", target})
    context.writes.push(
      `const ${context.helper}Next${slot} = ${extraction.residualExpression}`,
    )
  }
  return extraction.fragments.length > 0 || extraction.residualExpression !== null
}

function componentStyleSheets(context: CompileContext): string {
  if (context.styleFragments.length === 0) return "[]"
  const identity = context.styleFragments.map(fragment => fragment.id).join("\0")
  const hash = createHash("sha256")
    .update(`${context.sourceIdentity}\0${context.componentName}\0execution-sheet\0${identity}`)
    .digest("base64url")
    .slice(0, 16)
  const cssText = concatenateStyleExpressions(
    context.styleFragments.map(fragment => fragment.cssTextExpression),
  )
  const authored = context.styleFragments.flatMap(fragment =>
    fragment.sourceCssTextExpression === null ? [] : [fragment.sourceCssTextExpression]
  )
  const source = context.styleSourceModuleId === null || authored.length === 0
    ? ""
    : `, {kind: "authored-css", moduleId: ${JSON.stringify(context.styleSourceModuleId)}, componentName: ${JSON.stringify(context.componentName)}, cssText: ${concatenateStyleExpressions(authored)}}`
  return `[${context.helper}StyleSheet(${JSON.stringify(`z:${hash}`)}, ${cssText}${source})]`
}

function concatenateStyleExpressions(expressions: readonly string[]): string {
  return expressions.join(` + ${JSON.stringify("\n")} + `)
}

function resolveCompiledCssTemplate(
  expression: Expression,
  context: CompileContext | ComponentExpressionContext,
  styleSite: Node,
): CompiledCssTemplateSource | null {
  const value = skipParentheses(expression)
  let tagged: TaggedTemplateExpression | undefined
  if (isTaggedTemplateExpression(value) && isExactCssTag(value, context.cssTagSymbols, context.symbols)) {
    tagged = value
  } else if (isIdentifier(value)) {
    const id = symbolId(context.symbols, value)
    if (id !== null) {
      tagged = context.cssTemplates.get(id)
      if (tagged) {
        let references = context.cssTemplateReferences.get(id)
        if (!references) {
          references = new Set()
          context.cssTemplateReferences.set(id, references)
        }
        references.add(value)
        let sites = context.cssTemplateSites.get(id)
        if (!sites) {
          sites = new Set()
          context.cssTemplateSites.set(id, sites)
        }
        sites.add(styleSite)
      }
    }
  }
  if (!tagged) return null
  context.consumedCss.add(tagged)
  const parts = cssTemplateParts(tagged, context.sourceFile, context.sourcePath)
  try {
    return Object.freeze({
      expressions: Object.freeze(parts.expressions),
      shape: parseCssTemplateShape(parts.strings),
    })
  } catch (error) {
    throw compileError(
      context.sourcePath,
      `invalid scoped css template: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function normalizedStyleSourceModuleId(value: string | undefined): string | null {
  if (value === undefined) return null
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError("styleSourceModuleId must be a non-empty string")
  }
  return value.trim()
}

function collectCssTemplateConstants(
  sourceFile: SourceFile,
  cssTagSymbols: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  sourcePath: string,
): ReadonlyMap<number, TaggedTemplateExpression> {
  const templates = new Map<number, TaggedTemplateExpression>()
  for (const statement of sourceFile.statements) {
    if (!isVariableStatement(statement)) continue
    const constant = (statement.declarationList.flags & NodeFlags.Const) !== 0
    for (const declaration of statement.declarationList.declarations) {
      if (!declaration.initializer || !isTaggedTemplateExpression(declaration.initializer) ||
        !isExactCssTag(declaration.initializer, cssTagSymbols, symbols)) continue
      if (statement.declarationList.declarations.length !== 1) {
        throw compileError(
          sourcePath,
          "a module CSS const must be the only declaration in its const statement",
        )
      }
      if (!constant || !isIdentifier(declaration.name)) {
        throw compileError(sourcePath, "module css templates require one immutable identifier const")
      }
      const id = symbolId(symbols, declaration.name)
      if (id !== null) templates.set(id, declaration.initializer)
    }
  }
  return templates
}

function assertCanonicalCssTemplateReuse(
  sourceFile: SourceFile,
  templates: ReadonlyMap<number, TaggedTemplateExpression>,
  referencesByTemplate: ReadonlyMap<number, ReadonlySet<Node>>,
  sitesByTemplate: ReadonlyMap<number, ReadonlySet<Node>>,
  symbols: ReadonlyMap<Node, number>,
  sourcePath: string,
): void {
  if (templates.size === 0) return
  const exported = exportedSymbolIds(sourceFile, symbols)
  for (const statement of sourceFile.statements) {
    if (!isVariableStatement(statement)) continue
    const statementExported = statement.modifiers?.some(
      modifier => modifier.getText(sourceFile) === "export",
    ) ?? false
    for (const declaration of statement.declarationList.declarations) {
      if (!isIdentifier(declaration.name)) continue
      const id = symbolId(symbols, declaration.name)
      if (id === null || !templates.has(id)) continue
      if (statementExported || exported.has(id)) {
        throw compileError(
          sourcePath,
          `module CSS const ${declaration.name.text} cannot be exported; keep component CSS in its owning TSX and publish reusable themes through a .css export`,
        )
      }
      const references = referencesByTemplate.get(id) ?? new Set<Node>()
      let unsupportedReference: Node | null = null
      visit(sourceFile, node => {
        if (unsupportedReference !== null || !isIdentifier(node) || node === declaration.name ||
          symbolId(symbols, node) !== id || references.has(node)) return
        unsupportedReference = node
      })
      if (unsupportedReference !== null) {
        throw compileError(
          sourcePath,
          `private module CSS const ${declaration.name.text} may only be referenced by compiled style sites`,
        )
      }
      const siteCount = sitesByTemplate.get(id)?.size ?? 0
      if (siteCount >= 2) continue
      throw compileError(
        sourcePath,
        `private module CSS const ${declaration.name.text} requires at least two compiled style sites, received ${siteCount}; inline its css template at its only use or remove the unused const`,
      )
    }
  }
}

function exportedSymbolIds(
  sourceFile: SourceFile,
  symbols: ReadonlyMap<Node, number>,
): ReadonlySet<number> {
  const exported = new Set<number>()
  const exportedNames = new Set<string>()
  for (const statement of sourceFile.statements) {
    if (!isExportDeclaration(statement) || statement.moduleSpecifier ||
      statement.exportClause?.kind !== SyntaxKind.NamedExports) continue
    for (const element of statement.exportClause.elements) {
      exportedNames.add((element.propertyName ?? element.name).text)
    }
  }
  if (exportedNames.size === 0) return exported
  for (const statement of sourceFile.statements) {
    if (!isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!isIdentifier(declaration.name) || !exportedNames.has(declaration.name.text)) continue
      const id = symbolId(symbols, declaration.name)
      if (id !== null) exported.add(id)
    }
  }
  return exported
}

function removableCssTemplateStatements(
  sourceFile: SourceFile,
  cssTagSymbols: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  consumedCss: ReadonlySet<Node>,
): readonly import("typescript/unstable/ast").VariableStatement[] {
  const removable: import("typescript/unstable/ast").VariableStatement[] = []
  for (const statement of sourceFile.statements) {
    if (!isVariableStatement(statement) || statement.declarationList.declarations.length !== 1 ||
      statement.modifiers?.some(modifier => modifier.getText(sourceFile) === "export")) continue
    const declaration = statement.declarationList.declarations[0]!
    if (!isIdentifier(declaration.name) || !declaration.initializer ||
      !isTaggedTemplateExpression(declaration.initializer) ||
      !isExactCssTag(declaration.initializer, cssTagSymbols, symbols) ||
      !consumedCss.has(declaration.initializer)) continue
    removable.push(statement)
  }
  return removable
}

function cssTemplateParts(
  tagged: TaggedTemplateExpression,
  sourceFile: SourceFile,
  sourcePath: string,
): Readonly<{strings: readonly string[]; expressions: readonly Expression[]}> {
  if (isNoSubstitutionTemplateLiteral(tagged.template)) {
    return Object.freeze({strings: Object.freeze([tagged.template.text]), expressions: Object.freeze([])})
  }
  if (!isTemplateExpression(tagged.template)) {
    throw compileError(sourcePath, "css requires an ordinary untagged template literal body")
  }
  const strings: string[] = [tagged.template.head.text]
  const expressions: Expression[] = []
  for (const span of tagged.template.templateSpans) {
    expressions.push(span.expression)
    strings.push(span.literal.text)
  }
  if (strings.length !== expressions.length + 1) {
    throw compileError(sourcePath, `css template shape is invalid in ${sourceFile.fileName}`)
  }
  return Object.freeze({strings: Object.freeze(strings), expressions: Object.freeze(expressions)})
}

function isExactCssTag(
  tagged: TaggedTemplateExpression,
  cssTagSymbols: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
): boolean {
  return isIdentifier(tagged.tag) && cssTagSymbols.has(symbolId(symbols, tagged.tag) ?? -1)
}

function collectUnstableStyleSymbols(
  declaration: FunctionDeclaration,
  sourceFile: SourceFile,
  symbols: ReadonlyMap<Node, number>,
): ReadonlySet<number> {
  const unstable = new Set<number>()
  const addNames = (node: Node): void => {
    visit(node, child => {
      if (!isIdentifier(child)) return
      const id = symbolId(symbols, child)
      if (id !== null) unstable.add(id)
    })
  }
  for (const parameter of declaration.parameters) addNames(parameter.name)
  if (declaration.body) {
    visit(declaration.body, node => {
      if (isVariableDeclaration(node)) addNames(node.name)
      if (isFunctionDeclaration(node) && node !== declaration && node.name) addNames(node.name)
      if (!isFunctionLikeDeclaration(node)) return
      for (const parameter of node.parameters) addNames(parameter.name)
    })
  }
  const componentStart = declaration.getStart(sourceFile)
  for (const statement of sourceFile.statements) {
    if (isClassDeclaration(statement) && statement.name &&
      statement.getStart(sourceFile) > componentStart) {
      addNames(statement.name)
      continue
    }
    if (!isVariableStatement(statement)) continue
    const stableBeforeComponent =
      (statement.declarationList.flags & NodeFlags.Const) !== 0 &&
      statement.getStart(sourceFile) < componentStart
    if (stableBeforeComponent) continue
    for (const variable of statement.declarationList.declarations) addNames(variable.name)
  }
  return unstable
}

function compileChild(child: JsxChild, context: CompileContext): string[] {
  if (isJsxFragment(child)) return compileJsx(child, context)
  if (isJsxText(child)) {
    const value = normalizeJsxText(child.text)
    if (value === "") return []
    const variable = nextNode(context)
    context.mount.push(`const ${variable} = document.createTextNode(${JSON.stringify(value)})`)
    return [variable]
  }
  if (isJsxElement(child) || isJsxSelfClosingElement(child)) {
    const opening = isJsxElement(child) ? child.openingElement : child
    const tag = opening.tagName.getText(context.sourceFile)
    if (tag === "slot") return compileSlotRange(child, context)
    if (/^[a-z]/.test(tag)) return [compileIntrinsic(child, opening, tag, context)]
    return compileComponentRange(child, "child", context)
  }
  if (!isJsxExpression(child) || !child.expression) return []
  const expression = skipParentheses(child.expression)
  if (isIdentifier(expression) && context.childrenExpressionKinds.get(expression) === "empty") return []
  if (isJsxFragment(expression)) return compileJsx(expression, context)
  const childrenKind = context.childrenExpressionKinds.get(expression)
  if (childrenKind === "invalid-compiled-component") throw compileError(context.sourcePath, "prepared JSX content requires a nominal ComponentValue from @zavx0z/immersive-component")
  if (childrenKind === "compiled-component") {
    return compileValueRange(expression, "conditional", context, true)
  }
  if (childrenKind === "prepared-content") return compileValueRange(expression, "conditional", context, false, false, true)
  if (isPropsFieldExpression(expression, "children", context)) {
    if (childrenKind === "component-children") {
      return compileValueRange(expression, "conditional", context, false, true)
    }
    if (childrenKind === "component") {
      return compileValueRange(expression, "child", context)
    }
    if (childrenKind === "nullable-component") {
      return compileValueRange(expression, "conditional", context, true)
    }
    if (childrenKind === "keyed-components") {
      return compileValueRange(expression, "keyed", context)
    }
    if (childrenKind !== "text") {
      throw compileError(
        context.sourcePath,
        "children props must be typed as authored JSX, authored JSX or null, keyed authored JSX, or primitive text",
      )
    }
  } else if (
    isChildrenNamedExpression(expression) &&
    childrenKind !== undefined &&
    childrenKind !== "unsupported"
  ) {
    throw compileError(
      context.sourcePath,
      "component-valued children require props.children or its destructured parameter binding",
    )
  }
  if (isConditionalExpression(expression)) return compileConditional(expression, context)
  const keyed = keyedMapExpression(expression, context)
  if (keyed !== null) return keyed
  if (context.arrayExpressions.has(expression)) {
    throw compileError(context.sourcePath, "array children require a keyed component .map() expression")
  }
  const variable = nextNode(context)
  context.mount.push(`const ${variable} = document.createTextNode("")`)
  const slot = context.bindings.length
  context.bindings.push({kind: "text", target: variable})
  context.writes.push(`const ${context.helper}Next${slot} = ${expression.getText(context.sourceFile)}`)
  return [variable]
}

function compileValueRange(
  expression: Expression,
  kind: "child" | "conditional" | "keyed",
  context: CompileContext,
  normalizeNullish = false,
  normalizeChildren = false,
  normalizePrepared = false,
): string[] {
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment(${JSON.stringify(`${kind}:start`)})`)
  context.mount.push(`const ${end} = document.createComment(${JSON.stringify(`${kind}:end`)})`)
  const slot = context.bindings.length
  context.bindings.push({kind: "range", start, end})
  const value = normalizePrepared
    ? `${context.helper}Slot({content: ${expression.getText(context.sourceFile)}})`
    : normalizeChildren
    ? `${context.helper}Children(${expression.getText(context.sourceFile)})`
    : expression.getText(context.sourceFile)
  context.writes.push(
    `const ${context.helper}Next${slot} = ${normalizeNullish ? `(${value} ?? null)` : value}`,
  )
  return [start, end]
}

function compileComponentRange(
  expression: JsxElement | JsxSelfClosingElement,
  kind: "child" | "conditional",
  context: CompileContext,
): string[] {
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment(${JSON.stringify(`${kind}:start`)})`)
  context.mount.push(`const ${end} = document.createComment(${JSON.stringify(`${kind}:end`)})`)
  const slot = context.bindings.length
  const compiled = componentExpression(expression, context)
  if (compiled.mergedProps) {
    context.bindings.push({kind: "range", start, end})
    context.writes.push(`const ${context.helper}Next${slot} = ${compiled.expression}`)
  } else {
    context.bindings.push({kind: "range", start, end, staticType: compiled.template})
    context.writes.push(`const ${context.helper}Next${slot} = ${compiled.props}`, `const ${context.helper}Next${slot}Key = ${compiled.key}`, `const ${context.helper}Next${slot}Content = ${compiled.content}`)
  }
  return [start, end]
}

function compileConditional(expression: ReturnType<typeof asConditional>, context: CompileContext): string[] {
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment("conditional:start")`)
  context.mount.push(`const ${end} = document.createComment("conditional:end")`)
  const slot = context.bindings.length
  context.bindings.push({kind: "range", start, end})
  context.writes.push(
    `const ${context.helper}Next${slot} = ${conditionalComponentValueExpression(expression, context)}`,
  )
  return [start, end]
}

function conditionalComponentValueExpression(
  expression: ReturnType<typeof asConditional>,
  context: ComponentExpressionContext,
  assigned = false,
): string {
  const whenTrue = conditionalBranch(expression.whenTrue, context, assigned)
  const whenFalse = conditionalBranch(expression.whenFalse, context, assigned)
  return `${expression.condition.getText(context.sourceFile)} ? ${whenTrue} : ${whenFalse}`
}

function conditionalBranch(expression: Expression, context: ComponentExpressionContext, assigned = false): string {
  const branch = skipParentheses(expression)
  if (isNullLiteral(branch) || (isIdentifier(branch) && branch.text === "undefined")) return "null"
  if (!isJsxElement(branch) && !isJsxSelfClosingElement(branch)) {
    throw compileError(context.sourcePath, "conditional JSX branches must be components, null or undefined")
  }
  return componentExpression(branch, context, assigned).expression
}

function keyedMapExpression(expression: Expression, context: CompileContext): string[] | null {
  const value = keyedMapValueExpression(expression, context)
  if (value === null) return null
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment("keyed:start")`)
  context.mount.push(`const ${end} = document.createComment("keyed:end")`)
  const slot = context.bindings.length
  context.bindings.push({kind: "range", start, end})
  context.writes.push(`const ${context.helper}Next${slot} = ${value}`)
  return [start, end]
}

function keyedMapValueExpression(
  expression: Expression,
  context: ComponentExpressionContext,
  assigned = false,
): string | null {
  if (!isCallExpression(expression) || !isPropertyAccessExpression(expression.expression)) return null
  if (expression.expression.name.text !== "map" || expression.arguments.length !== 1) return null
  const callback = expression.arguments[0]!
  if (!isArrowFunction(callback) || callback.parameters.length === 0) {
    throw compileError(context.sourcePath, "keyed JSX map requires an arrow callback")
  }
  const callbackModifiers = callback.modifiers?.map(modifier => modifier.getText(context.sourceFile)) ?? []
  if (callbackModifiers.includes("async")) {
    throw compileError(context.sourcePath, "keyed JSX map callback cannot be async")
  }
  const body = skipParentheses(callback.body as Expression)
  if (!isJsxElement(body) && !isJsxSelfClosingElement(body)) {
    throw compileError(context.sourcePath, "keyed JSX map body must be one component")
  }
  const compiled = componentExpression(body, context, assigned)
  if (compiled.key === "null") throw compileError(context.sourcePath, "dynamic JSX map components require key")
  const parameters = callback.parameters.map((parameter) => parameter.getText(context.sourceFile)).join(", ")
  return `${context.helper}Keyed(${expression.expression.expression.getText(context.sourceFile)}.map((${parameters}) => ${compiled.expression}))`
}

function componentExpression(
  expression: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
  assigned = false,
): ComponentExpression {
  context.consumedJsx.add(expression)
  const opening = isJsxElement(expression) ? expression.openingElement : expression
  if (!isIdentifier(opening.tagName)) {
    throw compileError(context.sourcePath, "dynamic component tag is unsupported")
  }
  const template = opening.tagName.text
  if (!context.components.has(symbolId(context.symbols, opening.tagName) ?? -1)) {
    throw compileError(context.sourcePath, `unknown component ${template}`)
  }
  const {props, key, content} = componentProps(expression, context, assigned)
  if (opening.attributes.properties.some(isJsxSpreadAttribute)) {
    const p = `${context.helper}Spread`
    const slot = new SlotAuthoring(context.sourceFile).attribute(expression, "slot")
    // Native object spread вычисляет все атрибуты один раз и в исходном порядке.
    // Выражения детей следуют после атрибутов; reserved fields не становятся props.
    return {
      expression: `((${p}Type, ${p}Props, ${p}Content) => { const ${p}Key = ${p}Props.key ?? null; delete ${p}Props.key; if (${p}Key !== null && typeof ${p}Key !== "string" && typeof ${p}Key !== "number") throw new TypeError("DOM component key must be a string or number"); if (Object.prototype.hasOwnProperty.call(${p}Props, "children")) throw new TypeError("component children must be authored between component tags"); if (Object.prototype.hasOwnProperty.call(${p}Props, "class") || Object.prototype.hasOwnProperty.call(${p}Props, "className")) throw new TypeError("class-based component styling is unsupported; pass one style prop"); if (Object.prototype.hasOwnProperty.call(${p}Props, "slot")) { ${assigned && slot !== undefined ? `if (${p}Props.slot !== ${JSON.stringify(slot)}) throw new TypeError("Spread cannot override a static slot assignment");` : `throw new TypeError("slot requires a static authored assignment");`} delete ${p}Props.slot } return __COMPONENT_HELPER__(${p}Type, ${p}Props, ${p}Key, ${p}Content) })(${template}, ${props}, ${content})`,
      props, key: "undefined", template, content, mergedProps: true,
    }
  }
  return {
    expression: `__COMPONENT_HELPER__(${template}, ${props}, ${key}, ${content})`,
    key,
    props,
    template,
    content,
  }
}

function componentProps(
  expression: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
  assigned: boolean,
): Readonly<{props: string; key: string; content: string}> {
  const opening = isJsxElement(expression) ? expression.openingElement : expression
  const properties: string[] = []
  const mergedProps = opening.attributes.properties.some(isJsxSpreadAttribute)
  let key = "null"
  let content = "undefined"
  for (const attribute of opening.attributes.properties) {
    if (isJsxSpreadAttribute(attribute)) {
      if (!context.standalonePropsSpread) throw compileError(context.sourcePath, "component prop spreads are unsupported")
      properties.push(`...(${attribute.expression.getText(context.sourceFile)})`)
      continue
    }
    if (!isJsxAttribute(attribute)) continue
    const name = attribute.name.getText(context.sourceFile)
    if (name === "slot") {
      if (!assigned) throw compileError(context.sourcePath, "Назначение slot допустимо только внутри компонента с объявленными слотами")
      if (mergedProps) properties.push(`"slot": ${JSON.stringify(new SlotAuthoring(context.sourceFile).attribute(expression, "slot"))}`)
      continue
    }
    if (name === "children") {
      throw compileError(
        context.sourcePath,
        "component children must be authored between component tags",
      )
    }
    if (name === "class" || name === "className") {
      throw compileError(
        context.sourcePath,
        "class-based component styling is unsupported; pass one style prop",
      )
    }
    if (name === "style") {
      properties.push(`${JSON.stringify(name)}: ${componentStyleAttributeExpression(attribute, context)}`)
      continue
    }
    const value = hostAttributeValue(attribute, context.sourceFile)
    if (value === null) {
      throw compileError(context.sourcePath, `unsupported JSX attribute ${name}`)
    }
    const expressionValue = value.transport === "static"
      ? JSON.stringify(value.staticValue)
      : value.expression
    if (name === "key" && !mergedProps) key = expressionValue
    else properties.push(`${JSON.stringify(name)}: ${expressionValue}`)
  }
  const outlets = context.componentSlots.get(symbolId(context.symbols, opening.tagName) ?? -1)
  if (outlets) {
    const children = isJsxElement(expression) ? expression.children.filter(child => !isEmptyJsxChild(child, context)) : []
    let plan: ReturnType<typeof planSlots>
    try {
      plan = planSlots({outlets, children: children.map(child => { const authoring = new SlotAuthoring(context.sourceFile); const origins = isJsxExpression(child) && child.expression ? context.jsxOrigins.get(skipParentheses(child.expression)) : undefined; return {slot: origins ? authoring.originName(origins) : authoring.childName(child)} })})
    } catch (error) {
      throw compileError(context.sourcePath, error instanceof Error ? error.message : String(error))
    }
    const values = children.map(child => componentChildValue(child, context, true))
    const input = `${context.helper}SlotChildren`
    const groups = plan.slots.map(group =>
      `[${JSON.stringify(group.name)}]: [${group.children.map(index => `${input}[${index}]`).join(", ")}]`)
    // Сначала вычисляются авторские выражения в исходном порядке, затем их адреса распределяются по областям.
    content = `((${input}) => ({${groups.join(", ")}}))([${values.join(", ")}])`
  } else {
    const children = componentChildrenValue(expression, context)
    if (children !== null) properties.push(`${JSON.stringify("children")}: ${children}`)
  }
  return Object.freeze({props: `{${properties.join(", ")}}`, key, content})
}

function componentStyleAttributeExpression(
  attribute: JsxAttribute,
  context: ComponentExpressionContext,
): string {
  const initializer = attribute.initializer
  if (!initializer || !isJsxExpression(initializer) || !initializer.expression) {
    throw compileError(context.sourcePath, "component style prop requires a JSX css expression")
  }
  return extractComponentStyle(skipParentheses(initializer.expression), {
    primitiveKinds: context.stylePrimitiveKinds,
    isPassThrough: expression => isPropsFieldExpression(expression, "style", context),
    resolveCssTemplate: expression => resolveCompiledCssTemplate(expression, context, attribute),
    styleEncoder: `${context.helper}EncodeStyle`,
    sourceFile: context.sourceFile,
    sourcePath: context.sourcePath,
  })
}

function componentChildrenValue(
  expression: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
): string | null {
  if (!isJsxElement(expression)) return null
  const children = expression.children.filter(child => !isEmptyJsxChild(child, context))
  if (children.length === 0) return null
  if (children.length === 1) return componentChildValue(children[0]!, context)

  const values: string[] = []
  for (const child of children) {
    if (isJsxFragment(child)) {
      throw compileError(context.sourcePath, "component children do not support JSX fragments")
    }
    if (!isJsxElement(child) && !isJsxSelfClosingElement(child)) {
      throw compileError(
        context.sourcePath,
        "multiple component children require explicit keyed governed components",
      )
    }
    const opening = isJsxElement(child) ? child.openingElement : child
    if (/^[a-z]/.test(opening.tagName.getText(context.sourceFile))) {
      throw compileError(
        context.sourcePath,
        "intrinsic elements cannot cross a component children boundary",
      )
    }
    const compiled = componentExpression(child, context)
    values.push(compiled.expression)
  }
  return `${context.helper}FixedChildren([${values.join(", ")}])`
}

function componentChildValue(child: JsxChild, context: ComponentExpressionContext, assigned = false): string {
  if (isJsxFragment(child)) {
    throw compileError(context.sourcePath, "component children do not support JSX fragments")
  }
  if (isJsxText(child)) return JSON.stringify(normalizeJsxText(child.text))
  if (isJsxElement(child) || isJsxSelfClosingElement(child)) {
    return componentElementChildValue(child, context, assigned)
  }
  if (!isJsxExpression(child) || !child.expression) {
    throw compileError(context.sourcePath, "empty component child is unsupported")
  }
  const value = skipParentheses(child.expression)
  if (isJsxFragment(value)) {
    throw compileError(context.sourcePath, "component children do not support JSX fragments")
  }
  if (isJsxElement(value) || isJsxSelfClosingElement(value)) {
    return componentElementChildValue(value, context, assigned)
  }
  if (isNullLiteral(value)) return "null"
  if (isIdentifier(value) && context.childrenExpressionKinds.get(value) === "empty") return "undefined"
  const keyed = keyedMapValueExpression(value, context, assigned)
  if (keyed !== null) return keyed
  const kind = context.childrenExpressionKinds.get(value)
  if (kind === "invalid-compiled-component") throw compileError(context.sourcePath, "prepared JSX content requires a nominal ComponentValue from @zavx0z/immersive-component")
  if (kind === "compiled-component" || kind === "prepared-content" || kind === "component-children") return value.getText(context.sourceFile)
  if (isConditionalExpression(value)) {
    if (kind === "text") return value.getText(context.sourceFile)
    return conditionalComponentValueExpression(asConditional(value), context, assigned)
  }
  if (context.jsxOrigins.has(value)) return value.getText(context.sourceFile)
  if (context.arrayExpressions.has(value) || kind === "keyed-components") {
    if (isPropsFieldExpression(value, "children", context)) return value.getText(context.sourceFile)
    throw compileError(
      context.sourcePath,
      "component array children require compiler-owned keyed JSX map or explicit keyed components",
    )
  }
  if (kind === "text") return value.getText(context.sourceFile)
  if (
    (kind === "component" || kind === "nullable-component") &&
    isPropsFieldExpression(value, "children", context)
  ) return value.getText(context.sourceFile)
  throw compileError(
    context.sourcePath,
    "component child expressions must be primitive text, children props, governed JSX, or compiler-owned keyed JSX",
  )
}

function componentElementChildValue(
  child: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
  assigned = false,
): string {
  const opening = isJsxElement(child) ? child.openingElement : child
  if (opening.tagName.getText(context.sourceFile) === "slot") {
    if (!assigned && new SlotAuthoring(context.sourceFile).attribute(child, "slot") !== undefined) {
      throw compileError(context.sourcePath, "Назначение slot допустимо только внутри компонента с объявленными слотами")
    }
    return slotValueExpression(child, context)
  }
  if (/^[a-z]/.test(opening.tagName.getText(context.sourceFile))) {
    throw compileError(
      context.sourcePath,
      "intrinsic elements cannot cross a component children boundary",
    )
  }
  return componentExpression(child, context, assigned).expression
}

/** Читает содержимое текущего получателя; fallback создаётся только для пустого слота. */
function slotValueExpression(
  element: JsxElement | JsxSelfClosingElement,
  context: ComponentExpressionContext,
): string {
  context.consumedJsx.add(element)
  if (!context.slotProps) throw compileError(context.sourcePath, "slot требует компонент-получатель")
  const name = new SlotAuthoring(context.sourceFile).attribute(element, "name") ?? ""
  const content = `${context.helper}SlotContent?.[${JSON.stringify(name)}]`
  const value = `${context.helper}Slot({content: ${content}})`
  const fallback = isJsxElement(element) ? element.children.filter(child => !isEmptyJsxChild(child, context)) : []
  if (fallback.length === 0) return value
  return `(${value} ?? ${context.helper}Slot({content: [${fallback.map(child => componentChildValue(child, context)).join(", ")}]}))`
}

/** Выпускает обычный conditional range вместо semantic Element slot. */
function compileSlotRange(element: JsxElement | JsxSelfClosingElement, context: CompileContext): string[] {
  if (new SlotAuthoring(context.sourceFile).attribute(element, "slot") !== undefined) {
    throw compileError(context.sourcePath, "Передача slot допустима только между тегами другого компонента")
  }
  const value = slotValueExpression(element, context)
  const start = nextNode(context)
  const end = nextNode(context)
  context.mount.push(`const ${start} = document.createComment("slot:start")`)
  context.mount.push(`const ${end} = document.createComment("slot:end")`)
  const index = context.bindings.length
  context.bindings.push({kind: "range", start, end})
  context.writes.push(`const ${context.helper}Next${index} = ${value}`)
  return [start, end]
}


function assertSingleReturnPath(
  declaration: FunctionDeclaration,
  finalReturn: ReturnStatement,
  sourcePath: string,
): void {
  const body = declaration.body
  if (!body) return
  const walk = (node: Node): void => {
    if (node !== declaration && isFunctionLikeDeclaration(node)) return
    if (isReturnStatement(node) && node !== finalReturn) {
      throw compileError(sourcePath, `${declaration.name!.text} has an unsupported nested or early return`)
    }
    node.forEachChild(child => {
      walk(child)
      return undefined
    })
  }
  walk(body)
}

function nextNode(context: CompileContext): string {
  const variable = `${context.helper}Node${context.nodeIndex}`
  context.nodeIndex += 1
  return variable
}

function normalizeJsxText(value: string): string {
  const lines = value.replaceAll("\t", " ").split(/\r?\n/)
  let lastNonEmpty = -1
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]!.trim() !== "") lastNonEmpty = index
  }
  let result = ""
  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index]!
    if (index !== 0) line = line.replace(/^ +/, "")
    if (index !== lines.length - 1) line = line.replace(/ +$/, "")
    if (line === "") continue
    result += line
    if (index !== lastNonEmpty) result += " "
  }
  return result
}

function attributeName(name: string): string {
  return name === "className" ? "class" : name === "htmlFor" ? "for" : name
}

function runtimeImportBindings(
  sourceFile: SourceFile,
  symbols: ReadonlyMap<Node, number>,
  cssIntrinsicSymbols: ReadonlySet<number>,
  sourcePath: string,
): RuntimeImportBindings {
  const css = new Set<number>(cssIntrinsicSymbols)
  const createRoot = new Set<number>()
  const browserCreateRoot = new Set<number>()
  const hooks = new Map<number, Readonly<{name: string; supported: boolean}>>()
  const memo = new Set<number>()
  for (const statement of sourceFile.statements) {
    if (!isImportDeclaration(statement) || !isStringLiteral(statement.moduleSpecifier)) continue
    if (statement.moduleSpecifier.text === "@zavx0z/immersive") {
      const named = statement.importClause?.namedBindings
      if (named && isNamedImports(named)) for (const specifier of named.elements) {
        const imported = specifier.propertyName?.text ?? specifier.name.text
        if (!["createRoot", "createBrowserRoot", "createDomRoot"].includes(imported)) continue
        if (statement.importClause?.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly) throw compileError(sourcePath, `${imported} must be imported as a runtime value`)
        const id = symbolId(symbols, specifier.name)
        if (id !== null) {
          createRoot.add(id)
          if (imported !== "createDomRoot") browserCreateRoot.add(id)
        }
      }
      continue
    }
    if (statement.moduleSpecifier.text === "@zavx0z/immersive-browser" ||
      statement.moduleSpecifier.text === "@zavx0z/immersive-browser/integration" ||
      statement.moduleSpecifier.text === "@zavx0z/immersive-browser/authoring" ||
      statement.moduleSpecifier.text === "@zavx0z/immersive/XReact/browser" ||
      statement.moduleSpecifier.text === "@zavx0z/immersive/XReact/browser/integration") {
      const named = statement.importClause?.namedBindings
      if (named && isNamedImports(named)) {
        for (const specifier of named.elements) {
          const imported = specifier.propertyName?.text ?? specifier.name.text
          if (imported !== "createRoot" && imported !== "useSpace" && imported !== "useFrame") continue
          if (statement.importClause?.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly) {
            throw compileError(sourcePath, `${imported} must be imported as a runtime value`)
          }
          const id = symbolId(symbols, specifier.name)
          if (id !== null) {
            if (imported === "createRoot") {
              createRoot.add(id)
              browserCreateRoot.add(id)
            } else hooks.set(id, Object.freeze({name: imported, supported: true}))
          }
        }
      }
      continue
    }
    if (statement.moduleSpecifier.text === "@zavx0z/immersive-template") {
      const named = statement.importClause?.namedBindings
      if (named && !isNamedImports(named)) {
        throw compileError(sourcePath, "@zavx0z/immersive-template namespace imports are unsupported for css")
      }
      for (const specifier of named?.elements ?? []) {
        if ((specifier.propertyName?.text ?? specifier.name.text) !== "css") continue
        throw compileError(sourcePath, "governed TSX uses the global css compiler intrinsic; remove the css import")
      }
      continue
    }
    if (statement.moduleSpecifier.text !== "@zavx0z/immersive-component" &&
      statement.moduleSpecifier.text !== "@zavx0z/immersive-component/authoring" &&
      statement.moduleSpecifier.text !== "@zavx0z/immersive/XReact") continue
    if (statement.importClause?.name) {
      throw compileError(sourcePath, `${statement.moduleSpecifier.text} has no default compiler import`)
    }
    const named = statement.importClause?.namedBindings
    if (named && !isNamedImports(named)) {
      throw compileError(sourcePath, `${statement.moduleSpecifier.text} namespace imports are unsupported`)
    }
    if (!named) continue
    for (const specifier of named.elements) {
      const imported = specifier.propertyName?.text ?? specifier.name.text
      const hook = imported === "use" || /^use[A-Z0-9]/.test(imported)
      if (
        (imported === "createRoot" || imported === "memo" || hook) &&
        (statement.importClause?.phaseModifier === SyntaxKind.TypeKeyword || specifier.isTypeOnly)
      ) {
        throw compileError(sourcePath, `${imported} must be imported as a runtime value`)
      }
      const id = symbolId(symbols, specifier.name)
      if (id === null) continue
      if (imported === "createRoot") createRoot.add(id)
      else if (imported === "memo") memo.add(id)
      else if (hook) {
        hooks.set(id, Object.freeze({
          name: imported,
          supported: supportedHookNames.has(imported),
        }))
      }
    }
  }
  return Object.freeze({css, createRoot, browserCreateRoot, hooks, memo})
}

function validateHookCalls(
  sourceFile: SourceFile,
  hookOwners: ReadonlySet<FunctionDeclaration>,
  hooks: ReadonlyMap<number, Readonly<{name: string; supported: boolean}>>,
  customHooks: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  sourcePath: string,
): void {
  const walk = (
    node: Node,
    owner: FunctionDeclaration | null,
    guarded: boolean,
  ): void => {
    if (isImportDeclaration(node) || isExportDeclaration(node) || isTypeNode(node)) return
    if (isIdentifier(node) && hooks.has(symbolId(symbols, node) ?? -1) &&
      !(isCallExpression(node.parent) && node.parent.expression === node)) {
      throw compileError(sourcePath, `${node.text} is a compile-time hook and cannot escape a direct call`)
    }
    let nextOwner = owner
    let nextGuarded = guarded
    if (isFunctionLikeDeclaration(node)) {
      if (isFunctionDeclaration(node) && hookOwners.has(node)) {
        nextOwner = node
        nextGuarded = false
      } else if (owner !== null) {
        nextGuarded = true
      } else {
        nextOwner = null
      }
    }
    if (nextOwner !== null && isHookControlFlow(node)) nextGuarded = true

    if (isCallExpression(node) && isIdentifier(node.expression)) {
      const id = symbolId(symbols, node.expression) ?? -1
      const hook = hooks.get(id) ?? (customHooks.has(id)
        ? Object.freeze({name: node.expression.text, supported: true})
        : undefined)
      const hookLikeName = node.expression.text === "use" || /^use[A-Z0-9]/.test(node.expression.text)
      if (hook) {
        if (!hook.supported) {
          throw compileError(sourcePath, `${hook.name} is outside the supported hook profile`)
        }
        if (nextOwner === null) {
          throw compileError(sourcePath, `${hook.name} must be called inside a compiled function component`)
        }
        if (nextGuarded) {
          throw compileError(sourcePath, `${hook.name} must be called unconditionally at component top level`)
        }
      } else if (nextOwner !== null && hookLikeName) {
        throw compileError(
          sourcePath,
          `custom or shadowed hook ${node.expression.text} is outside the active compiler profile`,
        )
      }
    }

    node.forEachChild(child => {
      walk(child, nextOwner, nextGuarded)
      return undefined
    })
  }
  walk(sourceFile, null, false)
}

function isHookControlFlow(node: Node): boolean {
  if (
    isIfStatement(node) || isConditionalExpression(node) || isDoStatement(node) ||
    isForInStatement(node) || isForOfStatement(node) || isForStatement(node) ||
    isSwitchStatement(node) || isTryStatement(node) || isWhileStatement(node) ||
    isWithStatement(node)
  ) return true
  if (!isBinaryExpression(node)) return false
  return node.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
    node.operatorToken.kind === SyntaxKind.BarBarToken ||
    node.operatorToken.kind === SyntaxKind.QuestionQuestionToken
}

function componentRootBindings(
  sourceFile: SourceFile,
  createRootBindings: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
): ReadonlySet<number> {
  const roots = new Set<number>()
  visit(sourceFile, node => {
    if (!isVariableDeclaration(node) || !isIdentifier(node.name) ||
      !isVariableDeclarationList(node.parent) ||
      (node.parent.flags & NodeFlags.Const) === 0) return
    if (!isCreateRootCall(node.initializer, createRootBindings, symbols)) return
    const id = symbolId(symbols, node.name)
    if (id !== null) roots.add(id)
  })
  return roots
}

function isComponentRootExpression(
  expression: Expression,
  roots: ReadonlySet<number>,
  createRootBindings: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
): boolean {
  const value = skipParentheses(expression)
  return isIdentifier(value)
    ? roots.has(symbolId(symbols, value) ?? -1)
    : isCreateRootCall(value, createRootBindings, symbols)
}

function isCreateRootCall(
  expression: Expression | undefined,
  createRootBindings: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
): boolean {
  if (!expression) return false
  const value = skipParentheses(expression)
  return isCallExpression(value) && isIdentifier(value.expression) &&
    createRootBindings.has(symbolId(symbols, value.expression) ?? -1)
}

function symbolId(symbols: ReadonlyMap<Node, number>, node: Node): number | null {
  return symbols.get(node) ?? null
}

/**
Связывает локальные имена первого параметра с исходными свойствами props.

Учитываются только прямые привязки объектного параметра, включая переименование
и значения по умолчанию. Вложенные объекты, rest и одноимённые переменные другого
scope не получают право передавать authored children или caller style.
*/
function componentPropsBindings(
  declaration: FunctionDeclaration,
  symbols: ReadonlyMap<Node, number>,
): PropsBindings {
  const parameter = declaration.parameters[0]
  const destructured = new Map<number, string>()
  if (!parameter) return {object: null, destructured}
  if (isIdentifier(parameter.name)) {
    return {object: symbolId(symbols, parameter.name), destructured}
  }
  if (isObjectBindingPattern(parameter.name)) {
    for (const binding of parameter.name.elements) {
      if (binding.dotDotDotToken || !binding.name || !isIdentifier(binding.name)) continue
      const property = binding.propertyName ?? binding.name
      if (!isIdentifier(property) && !isStringLiteral(property)) continue
      const id = symbolId(symbols, binding.name)
      if (id !== null) destructured.set(id, property.text)
    }
  }
  return {object: null, destructured}
}

/** Только доказанные поля самого props получают общие private symbols; extra keys остаются локальными. */
function componentInputNames(declaration: FunctionDeclaration, bindings: PropsBindings, symbols: ReadonlyMap<Node, number>): readonly string[] {
  const names = new Set(bindings.destructured.values())
  if (bindings.object !== null) visit(declaration, node => {
    if (isPropertyAccessExpression(node) && isIdentifier(node.expression) && symbolId(symbols, node.expression) === bindings.object) names.add(node.name.text)
    if (isElementAccessExpression(node) && isIdentifier(node.expression) && symbolId(symbols, node.expression) === bindings.object && isStringLiteral(node.argumentExpression)) names.add(node.argumentExpression.text)
  })
  return [...names]
}

function isPropsFieldExpression(
  expression: Expression,
  property: string,
  context: Pick<CompileContext, "propsBindings" | "symbols">,
): boolean {
  if (isIdentifier(expression)) {
    const id = symbolId(context.symbols, expression)
    return id !== null && context.propsBindings.destructured.get(id) === property
  }
  return context.propsBindings.object !== null &&
    isPropertyAccessExpression(expression) &&
    expression.name.text === property &&
    isIdentifier(expression.expression) &&
    symbolId(context.symbols, expression.expression) === context.propsBindings.object
}

function isChildrenNamedExpression(expression: Expression): boolean {
  return isIdentifier(expression)
    ? expression.text === "children"
    : isPropertyAccessExpression(expression) && expression.name.text === "children"
}

function isEmptyJsxChild(child: JsxChild, context: ComponentExpressionContext): boolean {
  if (isJsxText(child)) return normalizeJsxText(child.text) === ""
  if (!isJsxExpression(child)) return false
  if (child.expression === undefined) return true
  const value = skipParentheses(child.expression)
  return isIdentifier(value) && context.childrenExpressionKinds.get(value) === "empty"
}

function skipParentheses(expression: Expression): Expression {
  let current = expression
  while (isParenthesizedExpression(current)) current = current.expression
  return skipOuterExpressions(current)
}

function visit(node: Node, callback: (node: Node) => void): void {
  callback(node)
  node.forEachChild((child) => {
    visit(child, callback)
    return undefined
  })
}

function importInsertionOffset(source: string): number {
  const directive = /^(?:(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*;?)*/.exec(source)?.[0] ?? ""
  return directive.length
}

function uniqueHelperPrefix(source: string): string {
  let suffix = 0
  while (source.includes(`__zComp${suffix}`)) suffix += 1
  return `__zComp${suffix}`
}

function applyEdits(
  source: string,
  edits: readonly Edit[],
  sourcePath: string,
  helper: string,
): string {
  const ordered = [...edits].sort((left, right) => left.start - right.start || left.end - right.end)
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index]!.start < ordered[index - 1]!.end) {
      throw compileError(sourcePath, "compiler produced overlapping source edits")
    }
  }
  let result = source
  for (const edit of [...ordered].reverse()) {
    const text = edit.text.replaceAll("__COMPONENT_HELPER__", `${helper}Component`)
    result = `${result.slice(0, edit.start)}${text}${result.slice(edit.end)}`
  }
  return result
}

function assertNoReactRuntimeReferences(sourceFile: SourceFile, sourcePath: string): void {
  const reject = (moduleName: string): void => {
    if (!isReactRuntimeModule(moduleName)) return
    throw compileError(
      sourcePath,
      "React runtime references are forbidden; import hooks and createRoot from @zavx0z/immersive-component",
    )
  }
  visit(sourceFile, node => {
    if (isImportDeclaration(node) && isStringLiteral(node.moduleSpecifier)) {
      reject(node.moduleSpecifier.text)
      return
    }
    if (isExportDeclaration(node) && node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
      reject(node.moduleSpecifier.text)
      return
    }
    if (isImportEqualsDeclaration(node) && isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression && isStringLiteral(node.moduleReference.expression)) {
      reject(node.moduleReference.expression.text)
      return
    }
    if (!isCallExpression(node) || node.arguments.length === 0 ||
      !isStringLiteral(node.arguments[0]!)) return
    const dynamicImport = node.expression.kind === SyntaxKind.ImportKeyword
    const commonJsRequire = isIdentifier(node.expression) && node.expression.text === "require"
    const commonJsResolve = isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "resolve" && isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "require"
    if (dynamicImport || commonJsRequire || commonJsResolve) reject(node.arguments[0]!.text)
  })
}

function isReactRuntimeModule(moduleName: string): boolean {
  return moduleName === "react" || moduleName.startsWith("react/") ||
    moduleName === "react-dom" || moduleName.startsWith("react-dom/") ||
    moduleName === "react-reconciler" || moduleName.startsWith("react-reconciler/")
}

function assertNoSymbolWrites(
  sourceFile: SourceFile,
  protectedSymbols: ReadonlySet<number>,
  symbols: ReadonlyMap<Node, number>,
  sourcePath: string,
): void {
  const rejectWritten = (node: Node): void => {
    visit(node, candidate => {
      if (!isIdentifier(candidate)) return
      const id = symbolId(symbols, candidate)
      if (id !== null && protectedSymbols.has(id)) {
        throw compileError(
          sourcePath,
          `compiled component binding ${candidate.text} cannot be reassigned`,
        )
      }
    })
  }
  visit(sourceFile, node => {
    if (isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind)) {
      rejectWritten(node.left)
      return
    }
    if (isPrefixUnaryExpression(node) || isPostfixUnaryExpression(node)) {
      if (node.operator === SyntaxKind.PlusPlusToken || node.operator === SyntaxKind.MinusMinusToken) {
        rejectWritten(node.operand)
      }
    }
  })
}

function compileError(sourcePath: string, message: string): JsxCompileError {
  return new JsxCompileError(message, sourcePath)
}

function asConditional(node: Node) {
  if (!isConditionalExpression(node)) throw new TypeError("Expected ConditionalExpression")
  return node
}
