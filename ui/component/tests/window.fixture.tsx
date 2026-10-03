import {useState} from "@zavx0z/component"
import Window from "@ui-surfaces/window"
import WindowControl from "@ui-surfaces-window/control"

/** Независимая кнопка и оболочка разделяют только controlled-видимость. */
export function WindowPairFixture() {
  const [open, setOpen] = useState(true)
  return <div style={css`
    position: relative;
    width: 100%;
    height: 100%;
  `}>
    <WindowControl
      windowId="pair-window"
      label="Документ"
      open={open}
      onOpenChange={setOpen}
    />
    <Window
      id="pair-window"
      title="Документ"
      open={open}
      onOpenChange={setOpen}
      movable={true}
      resizable={true}
    >
      <WindowDraft />
    </Window>
  </div>
}

/** Неконтролируемое поле позволяет проверить сохранение пользовательского ввода. */
function WindowDraft() {
  return <input
    aria-label="Черновик"
    defaultValue="Текст"
  />
}
