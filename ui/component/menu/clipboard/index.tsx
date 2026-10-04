/**
Меню команд существующего контроллера буфера обмена.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {useSyncExternalStore} from "@zavx0z/immersive-component"
import Menu from "@zavx0z/immersive-ui-component-menu-basic"


export type {ImmersiveUiComponentMenuClipboard} from "./contract"

import type {ImmersiveUiComponentMenuClipboard} from "./contract"

export default function ClipboardMenu(props: ImmersiveUiComponentMenuClipboard.Input): ImmersiveUiComponentMenuClipboard.Output {
  const state = useSyncExternalStore(props.controller.subscribe, props.controller.getSnapshot)
  return <Menu
    open={state.open}
    x={state.x}
    y={state.y}
    label="Буфер обмена"
    error={state.error}
    onClose={props.controller.close}
    items={[
      {key: "copy", label: "Копировать", shortcut: "⌘/Ctrl+C", disabled: !state.canCopy || state.pending,
        onSelect: () => { void props.controller.copy() }},
      {key: "paste", label: "Вставить", shortcut: "⌘/Ctrl+V", disabled: !state.canPaste || state.pending,
        onSelect: () => { void props.controller.paste() }},
    ]}
  />
}
