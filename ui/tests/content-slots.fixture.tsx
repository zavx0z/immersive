import {Button} from "../buttons/button.tsx"
import {StatusBar} from "../feedback/status-bar.tsx"
import {FieldGroup} from "../fields/field-group.tsx"
import {Frame} from "../surfaces/frame.tsx"
import {Pane, type PaneTextContent} from "../surfaces/pane.tsx"
import {Panel} from "../surfaces/panel.tsx"
import {Tab} from "../surfaces/tab/index.tsx"
import {Window} from "../surfaces/window.tsx"

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
      subtitle=""
      active={true}
      minimized={false}
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
