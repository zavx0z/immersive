import {Menu, MenuItem, ClipboardMenu, type ImmersiveUiComponentMenu, type ImmersiveUiComponentMenuClipboard} from "@zavx0z/immersive-ui-component-menu"

/** Реальная композиция участников для проверки их общего представления. */
export default function MenuExamples(props: {disabled: boolean}): ImmersiveUiComponentMenu.Output {
  const state = Object.freeze({open: true, x: 180, y: 0, canCopy: !props.disabled, canPaste: false, pending: false, error: null})
  const controller: ImmersiveUiComponentMenuClipboard.Input["controller"] = {
    getSnapshot: () => state,
    subscribe: () => () => {},
    async copy() {},
    async paste() {},
    close() {},
  }
  return <section>
    <MenuItem
      label="Самостоятельная команда"
      disabled={props.disabled}
      onSelect={() => {}}
    />
    <Menu
      open={true}
      x={0}
      y={0}
      label="Действия"
      items={[
        {
          key: "action",
          label: "Команда меню",
          disabled: props.disabled,
          onSelect() {},
        },
      ]}
      onClose={() => {}}
    />
    <ClipboardMenu
      controller={controller}
    />
  </section>
}
