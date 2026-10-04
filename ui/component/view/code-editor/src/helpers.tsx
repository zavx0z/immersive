import {memo} from "@zavx0z/immersive-component"
import type {Zavx0zImmersiveUiComponentViewCodeEditorViewModel} from "@zavx0z/immersive-ui-component-view-code-editor-view-model"
type CodeEditorSegment = Zavx0zImmersiveUiComponentViewCodeEditorViewModel.Output["segments"][number][number]
import type {Zavx0zImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
type CodeEditorLineDecoration = NonNullable<Zavx0zImmersiveUiComponentViewCodeEditor.Input["lineDecorations"]>[number]
import {codeEditorPaintRuns} from "./paint-runs.ts"
import type {CodeEditorPaintRun} from "./paint-runs.ts"

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export function LineNumber(props: Readonly<{index: number; continuation: boolean; decoration: CodeEditorLineDecoration | undefined}>) {
  const label = props.continuation ? "" : String(props.index + 1)
  return <li
    data-line-index={String(props.index)}
    data-tone={props.decoration?.gutterTone}
    title={props.decoration?.title}
    style={css`
      box-sizing: border-box;
      display: block;
      min-width: 24px;
      height: var(--code-editor-line-height, 16px);
      min-height: var(--code-editor-line-height, 16px);
      text-align: right;
      white-space: nowrap;

      &[data-tone="info"] {
        background: var(--state-info);
      }

      &[data-tone="success"] {
        background: var(--state-success);
      }

      &[data-tone="warning"] {
        background: var(--state-warning);
      }

      &[data-tone="error"] {
        background: var(--state-error);
      }
    `}
  >
    {label}
  </li>
}

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export function StyledCodeRun(props: Readonly<{run: CodeEditorPaintRun}>) {
  return <span
    data-token-key={props.run.key}
    data-token-category={props.run.category}
    style={css`
      display: inline;
      white-space: pre;
      color: ${props.run.foreground};
      background: ${props.run.background ?? "transparent"};
    `}
  >
    {props.run.text}
  </span>
}

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export function CodeRun(props: Readonly<{run: CodeEditorPaintRun}>) {
  const plain = props.run.inheritForeground === true && props.run.background === undefined
  const text = plain ? props.run.text : ""
  return <>
    {text}
    {!plain ? <StyledCodeRun run={props.run} /> : null}
  </>
}

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export function FormattingCharacters(props: Readonly<{value: string}>) {
  return <span
    data-formatting-characters=""
    style={css`
      display: none;
    `}
  >
    {props.value}
  </span>
}

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export function CodeLine(props: Readonly<{index: number; continuation: boolean; separator: string; formatting: string; segments: readonly CodeEditorSegment[]; decoration: CodeEditorLineDecoration | undefined}>) {
  const runs = codeEditorPaintRuns(props.segments)
  return <>
    {props.separator}
    <span
      data-line-index={String(props.index)}
      data-line-continuation={props.continuation ? "true" : undefined}
      data-line-tone={props.decoration?.lineTone}
      data-marker-tone={props.decoration?.markerTone}
      title={props.decoration?.title}
      style={css`
        box-sizing: border-box;
        display: block;
        width: 100%;
        min-width: 0;
        height: var(--code-editor-line-height, 16px);
        min-height: var(--code-editor-line-height, 16px);
        white-space: pre;
        padding-left: 2px;
        border-left-width: 0;
        border-left-style: solid;
        border-left-color: transparent;

        &[data-line-tone="info"] {
          background: var(--state-info);
        }

        &[data-line-tone="success"] {
          background: var(--state-success);
        }

        &[data-line-tone="warning"] {
          background: var(--state-warning);
        }

        &[data-line-tone="error"] {
          background: var(--state-error);
        }

        &[data-marker-tone="info"] {
          padding-left: 0;
          border-left-width: 2px;
          border-left-color: var(--state-info);
        }

        &[data-marker-tone="success"] {
          padding-left: 0;
          border-left-width: 2px;
          border-left-color: var(--state-success);
        }

        &[data-marker-tone="warning"] {
          padding-left: 0;
          border-left-width: 2px;
          border-left-color: var(--state-warning);
        }

        &[data-marker-tone="error"] {
          padding-left: 0;
          border-left-width: 2px;
          border-left-color: var(--state-error);
        }
      `}
    >
      {runs.map(run => <CodeRun
        key={run.key}
        run={run}
      />)}
      {props.formatting !== "" ? <FormattingCharacters value={props.formatting} /> : null}
    </span>
  </>
}

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export const MemoLineNumber = memo(LineNumber)

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export const MemoCodeLine = memo(CodeLine, (previous, next) => previous.index === next.index &&
  previous.continuation === next.continuation &&
  previous.formatting === next.formatting &&
  previous.decoration?.lineTone === next.decoration?.lineTone && previous.decoration?.markerTone === next.decoration?.markerTone &&
  previous.decoration?.gutterTone === next.decoration?.gutterTone && previous.decoration?.title === next.decoration?.title &&
  previous.separator === next.separator && previous.segments.length === next.segments.length &&
  previous.segments.every((segment, index) => {
    const candidate = next.segments[index]!
    return segment.key === candidate.key && segment.text === candidate.text &&
      segment.foreground === candidate.foreground && segment.background === candidate.background &&
      segment.inheritForeground === candidate.inheritForeground
  }))
