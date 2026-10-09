/**
Представление терминального вывода и ввода команд.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveTechTerminal} from "@zavx0z/immersive-tech-terminal"
type TerminalLine = ImmersiveTechTerminal.Output["snapshot"]["lines"][number]
import {MemoTerminalLine} from "./src/helpers.tsx"
import type {ImmersiveUiComponentWidgetTerminal as Contract} from "./contract"
import type {TerminalSelectionSnapshot} from "./contract/types.ts"
import type {TerminalTextPosition} from "./contract/types.ts"
import {emptyLines} from "./src/helpers.tsx"
import {readTerminalSelectionOffsets} from "./src/selection.ts"
import {useCallback} from "@zavx0z/immersive-component"
import {useLayoutEffect} from "@zavx0z/immersive-component"
import {useRef} from "@zavx0z/immersive-component"
import {useState} from "@zavx0z/immersive-component"
import {useSyncExternalStore} from "@zavx0z/immersive-component"
import TextField from "@zavx0z/immersive-ui-component-field-text"
import WidgetHeader from "@zavx0z/immersive-ui-component-widget-header"


export type {ImmersiveUiComponentWidgetTerminal} from "./contract"

export default function Terminal(props: Contract.Input): Contract.Output {
  const inputHost = useRef<HTMLDivElement | null>(null)
  const output = useRef<HTMLDivElement | null>(null)
  const composing = useRef(false)
  const finalComposition = useRef<string | null>(null)
  const [, restoreInput] = useState(0)
  const subscribe = useCallback((listener: () => void) => props.model?.subscribe(listener) ?? (() => {}), [props.model])
  const readLines = useCallback(() => props.model?.snapshot.lines ?? props.lines ?? emptyLines, [props.model, props.lines])
  const lines = useSyncExternalStore(subscribe, readLines)
  const currentLines = useRef(lines)
  currentLines.current = lines
  const selectionSource = useRef<Readonly<{lines: readonly TerminalLine[]; text: string; starts: readonly number[]}> | null>(null)
  useLayoutEffect(() => {
    if (props.followOutput !== false) output.current?.lastElementChild?.scrollIntoView({block: "end", inline: "nearest"})
  }, [lines, props.followOutput])
  useLayoutEffect(() => {
    const handle = Object.freeze({
      focus() { inputHost.current?.querySelector<HTMLInputElement>("input")?.focus({preventScroll: true}) },
      isFocused() { return inputHost.current?.querySelector("input") === document.activeElement },
      getSelection(): TerminalSelectionSnapshot | null {
        const root = output.current
        if (!root) return null
        if (selectionSource.current?.lines !== currentLines.current) {
          const starts = [0]
          const text = currentLines.current.map(line => line.runs.map(run => run.text).join("")).join("\n")
          for (let index = 0; index < text.length; index++) if (text[index] === "\n") starts.push(index + 1)
          selectionSource.current = {lines: currentLines.current, text, starts}
        }
        const {text, starts} = selectionSource.current
        const selection = readTerminalSelectionOffsets(root, text.length)
        if (!selection) return null
        const {anchor, focus} = selection
        const position = (offset: number): TerminalTextPosition => {
          let low = 0
          let high = starts.length - 1
          while (low < high) {
            const middle = Math.ceil((low + high) / 2)
            if (starts[middle]! <= offset) low = middle
            else high = middle - 1
          }
          return Object.freeze({line: low, col: offset - starts[low]!})
        }
        return Object.freeze({
          anchor: position(anchor),
          focus: position(focus),
          start: position(Math.min(anchor, focus)),
          end: position(Math.max(anchor, focus)),
          text: text.slice(Math.min(anchor, focus), Math.max(anchor, focus)),
        })
      },
      getOutputScrollPosition() { return Object.freeze({left: output.current?.scrollLeft ?? 0, top: output.current?.scrollTop ?? 0}) },
    })
    props.onReady?.(handle)
    return () => props.onReady?.(null)
  }, [props.onReady])
  const reset = () => restoreInput(revision => revision + 1)
  const onInput = (value: string, event: InputEvent) => {
    if (props.inputMode !== "stream") { props.onInput?.(value, event); return }
    if (composing.current || event.isComposing) return
    const compositionCommit = event.inputType === "insertText" || event.inputType === "insertFromComposition"
    if (compositionCommit && finalComposition.current !== null && (event.data === finalComposition.current || value === finalComposition.current)) {
      finalComposition.current = null
      reset()
      return
    }
    finalComposition.current = null
    if (value !== "") props.onData?.(value, event.inputType === "insertFromPaste" ? "paste" : "keyboard")
    reset()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    props.onKeyDown?.(event)
    if (event.defaultPrevented || props.inputEnabled === false || event.isComposing) return
    finalComposition.current = null
    if (props.inputMode !== "stream") {
      if (event.key === "Enter") { event.preventDefault(); props.onSubmit?.(props.input, event) }
      return
    }
    const data = event.key === "Enter" ? "\r" : event.key === "Backspace" ? "\x7f" : event.key === "Tab" ? "\t"
      : (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && document.getSelection()?.toString() === "" ? "\x03" : ""
    if (data === "") return
    event.preventDefault()
    props.onData?.(data, "keyboard")
  }
  return <section
    aria-label={props.title}
    data-widget="terminal"
    onKeyDown={event => {
      if (!inputHost.current?.contains(event.target as Node)) props.onKeyDown?.(event)
    }}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border: var(--border-width-control) solid var(--widget-toolbar-outline);
      border-radius: var(--widget-radius);
      background: var(--editor-background);
      color: var(--editor-content);

      ${props.style}
    `}
  >
    <WidgetHeader
      title={props.title}
      subtitle={props.subtitle}
      status={props.status}
      statusTone={props.statusTone}
      actions={props.actions}
    />
    <div
      ref={output}
      role="log"
      aria-label={`${props.title} output`}
      contentEditable="false"
      style={css`
        box-sizing: border-box;
        display: block;
        flex-grow: 1;
        min-width: 0;
        min-height: 0;
        overflow: auto;
        padding: 8px;
        white-space: normal;
        font-family: monospace;
        font-size: 13px;
      `}
    >
      {lines.map((line, index) => <MemoTerminalLine
        key={line.id}
        line={line}
        separator={index === 0 ? "" : "\n"}
      />)}
    </div>
    <div
      ref={inputHost}
      hidden={props.showInput === false}
      onKeyDown={onKeyDown}
      onFocusIn={() => props.onFocusChange?.(true)}
      onFocusOut={() => props.onFocusChange?.(false)}
      onCompositionStart={() => { composing.current = true; finalComposition.current = null }}
      onCompositionEnd={event => {
        composing.current = false
        if (props.inputMode !== "stream") return
        finalComposition.current = event.data
        if (event.data !== "") props.onData?.(event.data, "keyboard")
        reset()
      }}
      style={css`
        display: flex;
        width: 100%;
        min-height: 24px;
        padding: 4px;
        box-sizing: border-box;

        &[hidden] {
          display: none;
        }
      `}
    >
      <TextField
        value={props.inputMode === "stream" ? "" : props.input}
        disabled={props.inputEnabled === false}
        placeholder={props.placeholder}
        title={`${props.title} input`}
        onInput={onInput}
        style={css`
          width: 100%;
          --text-field-width: 100%;
        `}
      />
    </div>
  </section>
}
