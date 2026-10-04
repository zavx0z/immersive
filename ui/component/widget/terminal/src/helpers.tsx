import type {Zavx0zImmersiveTechTerminal} from "@zavx0z/immersive-tech-terminal"
type TerminalLine = Zavx0zImmersiveTechTerminal.Output["snapshot"]["lines"][number]
type TerminalRun = Zavx0zImmersiveTechTerminal.Output["snapshot"]["lines"][number]["runs"][number]
import {memo} from "@zavx0z/immersive-component"

/** Частная подготовка представление терминального вывода и ввода команд. */
export function TerminalTextRun(props: Readonly<{run: TerminalRun}>) {
  const plain = !props.run.color && !props.run.background && !props.run.bold
  const text = plain ? props.run.text : ""
  return <>
    {text}
    {!plain ? <TerminalStyledRun run={props.run} /> : null}
  </>
}

/** Частная подготовка представление терминального вывода и ввода команд. */
export function TerminalStyledRun(props: Readonly<{run: TerminalRun}>) {
  return <span
    style={css`
      white-space: pre;
      color: ${props.run.color ?? "inherit"};
      background: ${props.run.background ?? "transparent"};
      font-weight: ${props.run.bold ? 700 : 400};
    `}
  >
    {props.run.text}
  </span>
}

/** Частная подготовка представление терминального вывода и ввода команд. */
export function TerminalLineView(props: Readonly<{line: TerminalLine; separator: string}>) {
  return <>
    {props.separator}
    <div
      data-terminal-line={props.line.id}
      style={css`
        display: block;
        min-height: 18px;
        white-space: pre;
        line-height: 18px;
      `}
    >
      {props.line.runs.map((run, index) => <TerminalTextRun
        key={String(index)}
        run={run}
      />)}
    </div>
  </>
}

/** Частная подготовка представление терминального вывода и ввода команд. */
export const MemoTerminalLine = memo(TerminalLineView)

/** Частная подготовка представление терминального вывода и ввода команд. */
export const emptyLines = Object.freeze([])
