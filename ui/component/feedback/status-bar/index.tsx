/**
Строка состояния с областями текста и действий.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {StatusBarItems} from "./src/helpers.tsx"
import type {Zavx0zImmersiveUiComponentFeedbackStatusBar as Contract} from "./contract"
import {normalizeStatusBarItems} from "./src/helpers.tsx"
import {hasSlot} from "@zavx0z/immersive-component/slot-presence"


export type {Zavx0zImmersiveUiComponentFeedbackStatusBar} from "./contract"

export default function StatusBar(props: Contract.Input): Contract.Output {
  const start = normalizeStatusBarItems(props.start ?? [])
  const end = normalizeStatusBarItems(props.end ?? [])
  const separator = props.separator ?? " | "
  if (typeof separator !== "string") throw new TypeError("StatusBar separator must be a string")
  const supplied = hasSlot()
  return <footer
    role="status"
    aria-label={props.title ?? "Status"}
    title={props.title}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      height: 24px;
      min-height: 24px;
      gap: 12px;
      padding: 2px 12px 0;
      border: 0 solid transparent;
      border-top: 2px solid var(--status-bar-top);
      border-radius: 0;
      background: var(--status-bar-background);
      color: var(--status-bar-content);
      font-size: 11px;
      line-height: 20px;
      overflow: clip;

      ${props.style}
    `}
  >
    <StatusBarItems
      items={start}
      separator={separator}
      alignment="start"
      hidden={supplied}
    />
    <span
      data-status-content=""
      hidden={!supplied}
      style={css`
        display: flex;
        align-items: center;
        min-width: 0;
        height: 100%;
        flex-grow: 1;
        overflow: clip;

        &[hidden] {
          display: none;
        }
      `}
    >
      <slot />
    </span>
    <StatusBarItems items={end} separator={separator} alignment="end" />
  </footer>
}
