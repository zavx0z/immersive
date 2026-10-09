/**
Проверка входных данных редактора исходного текста.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentViewCodeEditorValidate as Contract} from "./contract"
import type {ImmersiveUiComponentViewCodeEditor} from "@zavx0z/immersive-ui-component-view-code-editor"
type CodeEditorProps = ImmersiveUiComponentViewCodeEditor.Input
import assertNonEmpty from "@zavx0z/immersive-tech-text-assert-non-empty"
import CodeEditorModel from "@zavx0z/immersive-tech-text-editor"

export default function assertCodeEditorProps(props: Contract.Input[0]): Contract.Output {
  if (typeof props !== "object" || props === null) throw new TypeError("CodeEditor props must be an object")
  if (typeof props.value !== "string") throw new TypeError("CodeEditor value must be a string")
  if (typeof props.readOnly !== "boolean") throw new TypeError("CodeEditor readOnly must be a boolean")
  if (props.softBreaks !== undefined && (!props.readOnly || !Array.isArray(props.softBreaks))) {
    throw new TypeError("CodeEditor softBreaks доступны только для чтения и передаются массивом смещений")
  }
  if (props.showFormattingCharacters !== undefined && typeof props.showFormattingCharacters !== "boolean") {
    throw new TypeError("CodeEditor showFormattingCharacters must be a boolean")
  }
  if (props.model !== undefined && !(props.model instanceof CodeEditorModel)) throw new TypeError("CodeEditor model must be a CodeEditorModel")
  if (props.onChange !== undefined && typeof props.onChange !== "function") throw new TypeError("CodeEditor onChange must be a function")
  if (props.ref !== undefined && typeof props.ref !== "function") throw new TypeError("CodeEditor ref must be a function")
  if (props.onLineNumberClick !== undefined && typeof props.onLineNumberClick !== "function") {
    throw new TypeError("CodeEditor onLineNumberClick must be a function")
  }
  if (props.showLineMarkers !== undefined && typeof props.showLineMarkers !== "boolean") throw new TypeError("CodeEditor showLineMarkers must be a boolean")
  if (props.onLineMarkerClick !== undefined && typeof props.onLineMarkerClick !== "function") throw new TypeError("CodeEditor onLineMarkerClick must be a function")
  if (props.lineMarkerLabel !== undefined && typeof props.lineMarkerLabel !== "function") throw new TypeError("CodeEditor lineMarkerLabel must be a function")
  if (props.lineMarkers !== undefined) {
    if (!Array.isArray(props.lineMarkers)) throw new TypeError("CodeEditor lineMarkers must be an array")
    const lines = new Set<number>()
    for (const marker of props.lineMarkers) {
      if (!marker || !Number.isSafeInteger(marker.line) || marker.line < 0 || lines.has(marker.line)) throw new RangeError("CodeEditor line markers require unique non-negative line indices")
      assertNonEmpty(marker.iconSrc, "CodeEditor marker iconSrc")
      assertNonEmpty(marker.label, "CodeEditor marker label")
      if (marker.disabled !== undefined && typeof marker.disabled !== "boolean") throw new TypeError("CodeEditor marker disabled must be a boolean")
      lines.add(marker.line)
    }
  }
  if (props.languageId !== undefined) assertNonEmpty(props.languageId, "CodeEditor languageId")
  if (props.path !== undefined) assertNonEmpty(props.path, "CodeEditor path")
  if (props.showLineNumbers !== undefined && typeof props.showLineNumbers !== "boolean") {
    throw new TypeError("CodeEditor showLineNumbers must be a boolean")
  }
  if (props.title !== undefined && typeof props.title !== "string") throw new TypeError("CodeEditor title must be a string")
}

export type {ImmersiveUiComponentViewCodeEditorValidate} from "./contract"
