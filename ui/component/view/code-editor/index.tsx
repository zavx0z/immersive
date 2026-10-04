/**
Редактор исходного текста с подсветкой, выделением и общей моделью редактирования.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {MemoCodeLine} from "./src/helpers.tsx"
import {MemoLineNumber} from "./src/helpers.tsx"
import {useCallback} from "@zavx0z/immersive-component"
import {useLayoutEffect} from "@zavx0z/immersive-component"
import {useMemo} from "@zavx0z/immersive-component"
import {useRef} from "@zavx0z/immersive-component"
import {useSyncExternalStore} from "@zavx0z/immersive-component"
import CodeEditorModel from "@zavx0z/immersive-tech-text-editor"
import assertCodeEditorProps from "@zavx0z/immersive-ui-component-view-code-editor-validate"
import buildCodeEditorViewModel from "@zavx0z/immersive-ui-component-view-code-editor-view-model"
import resolveCodeEditorHighlighter from "@zavx0z/immersive-ui-component-view-code-editor-highlighter"
import type {ImmersiveUiComponentViewCodeEditor as Contract} from "./contract"
import type {CodeEditorHandle} from "./contract/types"
import type {CodeEditorLineDecoration} from "./contract/types"
import {codeEditorVisualRows} from "./src/visual-rows.ts"
import {attachCodeEditorInteraction} from "./src/interaction.ts"
import {createCodeEditorHandle} from "./src/interaction.ts"
import type {CodeEditorInteraction} from "./src/interaction.ts"


export type {ImmersiveUiComponentViewCodeEditor} from "./contract"

export default function CodeEditor(props: Contract.Input): Contract.Output {
  assertCodeEditorProps(props)
  const ownedModel = useMemo(() => new CodeEditorModel({value: props.value, readOnly: props.readOnly}), [])
  const model = props.model ?? ownedModel
  const code = useRef<HTMLElement | null>(null)
  const interaction = useRef<CodeEditorInteraction | null>(null)
  const handle = useRef<CodeEditorHandle | null>(null)
  const callback = useRef(props.onChange)
  callback.current = props.onChange
  const externalUpdate = useRef(false)
  const subscribe = useCallback((listener: () => void) => model.subscribe(listener), [model])
  const getValue = useCallback(() => model.snapshot.value, [model])
  const value = useSyncExternalStore(subscribe, getValue)
  useLayoutEffect(() => {
    if (model.snapshot.readOnly && !props.readOnly && handle.current) {
      const selected = handle.current.getSelection()
      model.setSelections(selected.selections, selected.primary)
    }
    model.setReadOnly(props.readOnly)
  }, [model, props.readOnly])
  useLayoutEffect(() => {
    externalUpdate.current = true
    try {
      model.replaceValue(props.value, {selection: "map"})
    } finally { externalUpdate.current = false }
  }, [model, props.value])
  useLayoutEffect(() => {
    if (props.readOnly || !code.current) return
    const binding = attachCodeEditorInteraction(code.current, model)
    interaction.current = binding
    return () => {
      binding.dispose()
      interaction.current = null
    }
  }, [model, props.readOnly])
  useLayoutEffect(() => { interaction.current?.sync() }, [model, value])
  useLayoutEffect(() => {
    if (!code.current || !props.onReady && !props.onSelectionChange) return
    const port = createCodeEditorHandle(code.current, model, selection => props.onSelectionChange?.(selection))
    handle.current = port.handle
    props.onReady?.(port.handle)
    return () => {
      port.dispose()
      handle.current = null
      props.onReady?.(null)
    }
  }, [model, props.onReady, props.onSelectionChange])
  useLayoutEffect(() => {
    let previous = model.snapshot.value
    return model.subscribe(snapshot => {
      if (snapshot.value === previous) return
      previous = snapshot.value
      if (!externalUpdate.current) callback.current?.(snapshot.value)
    })
  }, [model])
  // Supplied tokens describe props.value, not an unacknowledged local edit.
  const tokens = value === props.value ? props.tokens : undefined
  const softBreaks = value === props.value ? props.softBreaks : undefined
  const highlighter = tokens === undefined ? resolveCodeEditorHighlighter(props.languageId, props.path) : null
  // Supplied token arrays can be mutable. Only automatic highlighting is memoized.
  const automatic = useMemo(() => tokens === undefined ? buildCodeEditorViewModel({...props, value, tokens}) : null,
    [value, props.languageId, props.path, highlighter, highlighter?.tokenize, tokens === undefined])
  const view = automatic ?? buildCodeEditorViewModel({...props, value, tokens})
  const rows = codeEditorVisualRows(view, softBreaks, props.showFormattingCharacters !== false)
  const decorations = new Map<number, CodeEditorLineDecoration>()
  for (const decoration of props.lineDecorations ?? []) {
    if (!Number.isSafeInteger(decoration.line) || decoration.line < 0 || decorations.has(decoration.line)) {
      throw new RangeError("CodeEditor line decorations require unique non-negative line indices")
    }
    decorations.set(decoration.line, decoration)
  }
  return <section
    ref={props.ref}
    contentEditable="false"
    role="region"
    aria-label={props.title ?? "Code editor"}
    aria-readonly={String(props.readOnly)}
    data-language-id={view.resolvedLanguageId}
    data-path={props.path}
    title={props.title}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      width: 520px;
      height: 220px;
      min-width: 0;
      padding: 0;
      overflow: auto;
      scrollbar-width: thin;
      border: var(--border-width-control) solid var(--editor-border);
      border-radius: 4px;
      background: var(--editor-background);
      color: var(--editor-content);
      font-size: var(--font-size-sm);
      font-family: monospace;
      line-height: var(--code-editor-line-height, 16px);

      ${props.style}
    `}
  >
    <ul
      aria-hidden="true"
      hidden={props.showLineNumbers === false}
      onClick={event => {
        const target = event.target as HTMLElement | null
        const row = target?.closest?.("li[data-line-index]")
        if (row?.parentElement !== event.currentTarget) return
        props.onLineNumberClick?.(Number(row.getAttribute("data-line-index")), event)
      }}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        min-width: 42px;
        flex-shrink: 0;
        min-height: 0;
        margin: 0;
        padding: 8px;
        border-right: var(--border-width-control) solid var(--editor-border);
        background: var(--editor-gutter-background);
        color: var(--editor-line-number-content);
        user-select: none;

        &[hidden] {
          display: none;
        }
      `}
    >
      {rows.map(row => <MemoLineNumber
        key={row.key}
        index={row.line}
        continuation={row.continuation}
        decoration={decorations.get(row.line)}
      />)}
    </ul>
    <pre
      style={css`
        box-sizing: border-box;
        display: block;
        min-width: 0;
        min-height: 0;
        flex-grow: 1;
        margin: 0;
        padding: 8px 10px;
        overflow: visible;
        background: var(--editor-background);
        color: var(--editor-content);
      `}
    >
      <code
        ref={code}
        contentEditable={props.readOnly ? "false" : "plaintext-only"}
        role={props.readOnly ? undefined : "textbox"}
        aria-multiline={props.readOnly ? undefined : "true"}
        style={css`
          display: block;
          min-width: 100%;
          min-height: 0;
          white-space: normal;
        `}
      >
        {rows.map(row => <MemoCodeLine
          key={row.key}
          index={row.line}
          continuation={row.continuation}
          decoration={decorations.get(row.line)}
          separator={row.separator}
          formatting={row.formatting}
          segments={row.segments}
        />)}
      </code>
    </pre>
  </section>
}
