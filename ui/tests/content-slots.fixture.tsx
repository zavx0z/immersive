import Button from "@ui-buttons/button"
import StatusBar from "@ui-feedback/status-bar"
import FieldGroup from "@ui-fields/field-group"
import Frame from "@ui-surfaces/frame"
import Pane from "@ui-surfaces/pane"
import type {PaneTextContent} from "@ui-surfaces/pane"
import Panel from "@ui-surfaces/panel"
import Tab from "@ui-surfaces/tab"
import Window from "@ui-surfaces/window"

/** Обновление вложенности отдельно от primitive content проверяет прежний конфликт Pane. */
export function PaneSlotFixture(props: Readonly<{supplied: boolean; content?: PaneTextContent}>) {
  return (
    <Pane content={props.content}>
      {props.supplied ? <Button label="Вложенное" /> : null}
    </Pane>
  )
}

/** Пустая условная позиция не выполняет требование непустой группы. */
export function FieldGroupSlotFixture(props: Readonly<{supplied: boolean}>) {
  return (
    <FieldGroup>
      {props.supplied ? <Button label="Поле" /> : null}
    </FieldGroup>
  )
}

/** Обновление содержимого переключает custom часть и стартовую строку статуса. */
export function StatusBarSlotFixture(props: Readonly<{supplied: boolean}>) {
  return (
    <StatusBar
      start={[{id: "start", text: "Начало"}]}
      end={[{id: "end", text: "Конец"}]}
    >
      {props.supplied ? <Button label="Свой статус" /> : null}
    </StatusBar>
  )
}

/** Обязательная подпись Tab заменяется только непустым вложенным содержимым. */
export function TabSlotFixture(props: Readonly<{supplied: boolean; label?: string}>) {
  return (
    <Tab label={props.label}>
      {props.supplied ? <Button label="Вложенная кнопка" /> : null}
    </Tab>
  )
}

/** Несколько поверхностей передают один компонент через собственные точки вставки. */
export function SurfaceSlotFixture() {
  return (
    <Window
      title="Окно"
      id="slot-window"
      open={true}
      onOpenChange={() => {}}
      actions={[]}
    >
      <Frame
        title="Рамка"
        edge="floating"
        handles={[]}
      >
        <Panel
          label="Панель"
          expanded={true}
        >
          <Pane>
            <Button label="Сквозной контент" />
          </Pane>
        </Panel>
      </Frame>
    </Window>
  )
}
