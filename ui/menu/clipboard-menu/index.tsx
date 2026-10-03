/**
Меню команд существующего контроллера буфера обмена.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import {useSyncExternalStore} from "@zavx0z/component"
import Menu from "@ui-menus/menu"


export type {UiMenusClipboardMenu} from "./contract"

import type {UiMenusClipboardMenu} from "./contract"

export default function ClipboardMenu(props: UiMenusClipboardMenu.Input): UiMenusClipboardMenu.Output {
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
