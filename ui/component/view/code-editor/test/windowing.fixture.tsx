import CodeEditor from "../index.tsx"
import type {ImmersiveUiComponentViewCodeEditor} from "../contract/index.ts"

export type WindowingFixtureProps = ImmersiveUiComponentViewCodeEditor.Input & Readonly<{viewportHeight?: number | undefined}>

export function WindowingFixture(props: WindowingFixtureProps) {
  return <>
    <p>До редактора</p>
    <CodeEditor
      value={props.value}
      readOnly={props.readOnly}
      languageId={props.languageId}
      showLineNumbers={props.showLineNumbers}
      softBreaks={props.softBreaks}
      showFormattingCharacters={props.showFormattingCharacters}
      onReady={props.onReady}
      style={css`
        width: 500px;
        height: ${props.viewportHeight ?? 240}px;
        line-height: 20px;
        --code-editor-line-height: 20px;

        ${props.style}
      `}
    />
    <p>После редактора</p>
  </>
}
