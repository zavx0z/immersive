import {memo} from "@zavx0z/immersive-component"
import type {ImmersiveUiComponentViewCodeEditorViewModel} from "@zavx0z/immersive-ui-component-view-code-editor-view-model"
type CodeEditorSegment = ImmersiveUiComponentViewCodeEditorViewModel.Output["segments"][number][number]
import type {ImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
type CodeEditorLineDecoration = NonNullable<ImmersiveUiComponentViewCodeEditor.Input["lineDecorations"]>[number]
import {codeEditorPaintRuns} from "./paint-runs.ts"
import type {CodeEditorPaintRun} from "./paint-runs.ts"
import type {CodeEditorVisualRow} from "./visual-rows.ts"
import type {CodeEditorWindowBlock} from "./window-plan.ts"

/**
Настройки независимых действий номера и поля метки.

@property markers - Снимок меток текущего render, адресованных логическими строками.

@property showMarkers - Резервировать отдельное поле маркеров.

@property showLineNumbers - Показывать цифры номеров строк.

@property [onLineNumberClick] - Передаёт строку с нуля и событие клика номера.

@property [onLineMarkerClick] - Передаёт строку и событие отдельного поля метки.

@property [lineMarkerLabel] - Возвращает доступное имя пустого поля по строке с нуля.
*/
type GutterControls = Pick<ImmersiveUiComponentViewCodeEditor.Input,
  "onLineNumberClick" | "onLineMarkerClick" | "lineMarkerLabel"> & Readonly<{
  markers: ReadonlyMap<number, NonNullable<ImmersiveUiComponentViewCodeEditor.Input["lineMarkers"]>[number]>
  showMarkers: boolean
  showLineNumbers: boolean
}>

/**
Показывает номер и отдельную метку в одной логической строке, сохраняя высоту редактора.

@param props - Строка, оформление и действия владельца; continuation скрывает повторные номера и метки.

@returns Номер и узкое поле маркера с независимыми обработчиками.
*/
export function LineNumber(props: Readonly<{index: number; continuation: boolean; decoration: CodeEditorLineDecoration | undefined; controls: GutterControls}>) {
  const label = props.continuation ? "" : String(props.index + 1)
  const marker = props.continuation ? undefined : props.controls.markers.get(props.index)
  const markerLabel = marker?.label ?? props.controls.lineMarkerLabel?.(props.index) ?? `Метка строки ${props.index + 1}`
  return <li
    data-line-index={String(props.index)}
    data-tone={props.decoration?.gutterTone}
    data-line-continuation={props.continuation ? "true" : undefined}
    title={props.decoration?.title}
    style={css`
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 2px;
      min-width: 24px;
      height: var(--code-editor-line-height, 16px);
      min-height: var(--code-editor-line-height, 16px);
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
    <button
      hidden={!props.controls.showMarkers}
      type="button"
      data-line-marker={String(props.index)}
      aria-label={markerLabel}
      title={markerLabel}
      disabled={props.continuation || marker?.disabled === true || !props.controls.onLineMarkerClick}
      onClick={event => {
        event.stopPropagation()
        if (!props.continuation && !marker?.disabled) props.controls.onLineMarkerClick?.(props.index, event)
      }}
      style={css`
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 14px;
        height: var(--code-editor-line-height, 16px);
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;

        &[hidden] {
          display: none;
        }

        &:disabled {
          cursor: default;
        }
      `}
    >
      <img
        hidden={!marker}
        src={marker?.iconSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={css`
          width: 14px;
          height: 14px;

          &[hidden] {
            display: none;
          }
        `}
      />
    </button>
    <button
      hidden={!props.controls.showLineNumbers}
      type="button"
      data-line-number={String(props.index)}
      data-number-tone={props.continuation ? undefined : props.decoration?.numberTone}
      disabled={props.continuation || !props.controls.onLineNumberClick}
      onClick={event => {
        event.stopPropagation()
        if (!props.continuation) props.controls.onLineNumberClick?.(props.index, event)
      }}
      style={css`
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: var(--code-editor-line-height, 16px);
        padding: 0 2px;
        margin: 0;
        border: 1px solid transparent;
        border-radius: 4px;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;

        &[hidden] {
          display: none;
        }

        &:disabled {
          cursor: default;
        }

        &[data-number-tone="neutral"] {
          border-color: var(--editor-line-number-content);
        }

        &[data-number-tone="info"] {
          border-color: var(--state-info);
        }

        &[data-number-tone="success"] {
          border-color: var(--state-success);
        }

        &[data-number-tone="warning"] {
          border-color: var(--state-warning);
        }

        &[data-number-tone="error"] {
          border-color: var(--state-error);
        }
      `}
    >
      {label}
    </button>
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
export function CodeLine(props: Readonly<{index: number; visualIndex?: number | undefined; continuation: boolean; separator: string; formatting: string; segments: readonly CodeEditorSegment[]; decoration: CodeEditorLineDecoration | undefined}>) {
  const runs = codeEditorPaintRuns(props.segments)
  return <>
    {props.separator}
    <span
      data-line-index={String(props.index)}
      data-code-row-index={props.visualIndex === undefined ? undefined : String(props.visualIndex)}
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
      {runs.length > 0 ? <CodeLineContent runs={runs} /> : null}
      {props.formatting !== "" ? <FormattingCharacters value={props.formatting} /> : null}
    </span>
  </>
}

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export const MemoLineNumber = memo(LineNumber)

/** Частная подготовка редактор исходного текста с подсветкой, выделением и общей моделью редактирования. */
export const MemoCodeLine = memo(CodeLine, (previous, next) => previous.index === next.index &&
  previous.visualIndex === next.visualIndex &&
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

/** Скрытый raw Text не участвует в paint; spacer сохраняет высоту тех же строк. */
export function CodeWindowGap(props: Readonly<{count: number; value?: string | undefined}>) {
  return <span
    data-code-gap=""
    aria-hidden={props.value === undefined ? "true" : undefined}
    style={css`
      display: block;
      height: calc(var(--code-editor-line-height, 16px) * ${props.count});
      flex-shrink: 0;
    `}
  >
    <span
      style={css`
        display: none;
      `}
    >
      {props.value ?? ""}
    </span>
  </span>
}

/** Один keyed block держит identity закреплённой строки при движении окна. */
export function CodeWindowBlock(props: Readonly<{block: CodeEditorWindowBlock; decoration: CodeEditorLineDecoration | undefined}>) {
  const row = props.block.kind === "row" ? props.block.row : null
  return <>
    {props.block.kind === "gap" ? <CodeWindowGap
      count={props.block.end - props.block.start}
      value={props.block.text}
    /> : null}
    {row !== null ? <MemoCodeLine
      index={row.line}
      visualIndex={props.block.kind === "row" ? props.block.index : undefined}
      continuation={row.continuation}
      decoration={props.decoration}
      separator={row.separator}
      formatting={row.formatting}
      segments={row.segments}
    /> : null}
  </>
}

/**
Сохраняет геометрию пропущенных строк и показывает номер только материализованной строки.

@param props - Строки или блоки окна, их оформление и действия полей.

@returns Согласованные с кодом номера и маркеры без включения в исходный текст.
*/
export function LineNumberWindowBlock(props: Readonly<{block: CodeEditorWindowBlock; decoration: CodeEditorLineDecoration | undefined; controls: GutterControls}>) {
  const row = props.block.kind === "row" ? props.block.row : null
  return <>
    {props.block.kind === "gap" ? <CodeWindowGap count={props.block.end - props.block.start} /> : null}
    {row !== null ? <MemoLineNumber
      index={row.line}
      continuation={row.continuation}
      decoration={props.decoration}
      controls={props.controls}
    /> : null}
  </>
}


/**
Составляет поля номеров и меток из одного окна логических строк.

@param props - Строки или блоки окна, их оформление и действия полей.

@returns Согласованные с кодом номера и маркеры без включения в исходный текст.
*/
export function CodeEditorGutter(props: Readonly<{rows: readonly CodeEditorVisualRow[]; blocks: readonly CodeEditorWindowBlock[] | null; decorations: ReadonlyMap<number, CodeEditorLineDecoration>; controls: GutterControls}>) {
  return <ul
      data-code-gutter=""
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        min-width: 42px;
        flex-shrink: 0;
        min-height: 0;
        margin: 0;
        padding: 8px 4px;
        border-right: var(--border-width-control) solid var(--editor-border);
        background: var(--editor-gutter-background);
        color: var(--editor-line-number-content);
        user-select: none;

        &[hidden] {
          display: none;
        }
      `}
    >
      {props.blocks !== null ? <WindowedLineNumbers
        blocks={props.blocks}
        decorations={props.decorations}
        controls={props.controls}
      /> : <PlainLineNumbers
        rows={props.rows}
        decorations={props.decorations}
        controls={props.controls}
      />}
    </ul>
}

/** Изменение текста при прежних номерах не перерисовывает gutter и его композицию. */
export const MemoCodeEditorGutter = memo(CodeEditorGutter, (previous, next) =>
  previous.blocks === next.blocks && previous.controls.onLineNumberClick === next.controls.onLineNumberClick &&
  previous.controls.onLineMarkerClick === next.controls.onLineMarkerClick &&
  previous.controls.lineMarkerLabel === next.controls.lineMarkerLabel &&
  previous.controls.showMarkers === next.controls.showMarkers && previous.controls.showLineNumbers === next.controls.showLineNumbers &&
  previous.controls.markers.size === next.controls.markers.size && [...previous.controls.markers].every(([line, marker]) => {
    const candidate = next.controls.markers.get(line)
    return candidate !== undefined && candidate.iconSrc === marker.iconSrc && candidate.label === marker.label && candidate.disabled === marker.disabled
  }) &&
  previous.rows.length === next.rows.length && previous.rows.every((row, index) => {
    const candidate = next.rows[index]!
    return row.key === candidate.key && row.line === candidate.line && row.continuation === candidate.continuation
  }) && previous.decorations.size === next.decorations.size && [...previous.decorations].every(([line, decoration]) => {
    const candidate = next.decorations.get(line)
    return candidate !== undefined && candidate.gutterTone === decoration.gutterTone && candidate.numberTone === decoration.numberTone && candidate.title === decoration.title
  }))


type CodeRowsProps = Readonly<{rows: readonly CodeEditorVisualRow[]; blocks: readonly CodeEditorWindowBlock[] | null; decorations: ReadonlyMap<number, CodeEditorLineDecoration>}>

export function CodeEditorRows(props: CodeRowsProps) {
  return <>
    {props.blocks !== null ? <WindowedCodeRows
      blocks={props.blocks}
      decorations={props.decorations}
    /> : <PlainCodeRows
      rows={props.rows}
      decorations={props.decorations}
    />}
  </>
}

export function WindowedCodeRows(props: Readonly<{blocks: readonly CodeEditorWindowBlock[]; decorations: ReadonlyMap<number, CodeEditorLineDecoration>}>) {
  return <>
    {props.blocks.map(block => <CodeWindowBlock
      key={block.key}
      block={block}
      decoration={block.kind === "row" ? props.decorations.get(block.row.line) : undefined}
    />)}
  </>
}

export function PlainCodeRows(props: Readonly<{rows: readonly CodeEditorVisualRow[]; decorations: ReadonlyMap<number, CodeEditorLineDecoration>}>) {
  return <>
    {props.rows.map((row, index) => <MemoCodeLine
      key={row.key}
      index={row.line}
      visualIndex={index}
      continuation={row.continuation}
      decoration={props.decorations.get(row.line)}
      separator={row.separator}
      formatting={row.formatting}
      segments={row.segments}
    />)}
  </>
}

/** Размещает номера, метки и промежутки виртуального окна.

@param props - Строки окна и их оформление.

@returns Поля номеров и меток.
*/
export function WindowedLineNumbers(props: Readonly<{blocks: readonly CodeEditorWindowBlock[]; decorations: ReadonlyMap<number, CodeEditorLineDecoration>; controls: GutterControls}>) {
  return <>
    {props.blocks.map(block => <LineNumberWindowBlock
      key={block.key}
      block={block}
      decoration={block.kind === "row" ? props.decorations.get(block.row.line) : undefined}
      controls={props.controls}
    />)}
  </>
}

/** Размещает поля всех строк короткого либо редактируемого документа.

@param props - Строки окна и их оформление.

@returns Поля номеров и меток.
*/
export function PlainLineNumbers(props: Readonly<{rows: readonly CodeEditorVisualRow[]; decorations: ReadonlyMap<number, CodeEditorLineDecoration>; controls: GutterControls}>) {
  return <>
    {props.rows.map(row => <MemoLineNumber
      key={row.key}
      index={row.line}
      continuation={row.continuation}
      decoration={props.decorations.get(row.line)}
      controls={props.controls}
    />)}
  </>
}


/** Inline рамка позволяет измерить реальную ширину посещённой непустой строки. */
export function CodeLineContent(props: Readonly<{runs: readonly CodeEditorPaintRun[]}>) {
  return <span
        data-code-line-content=""
        style={css`
          display: inline;
          white-space: pre;
        `}
      >
        {props.runs.map(run => <CodeRun
          key={run.key}
          run={run}
        />)}
      </span>
}
