/**
ReferenceParameter соединяет публичный ReferenceField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import ReferenceField from "@zavx0z/immersive-ui-component-field-reference"
import ParameterLayout from "@zavx0z/immersive-nodes-parameter-shared-layout"
import type {ImmersiveNodesParameterReference as Contract} from "./contract"

export type {ImmersiveNodesParameterReference} from "./contract"

/**
Авторский контракт ReferenceParameter; общий протокол описан в ImmersiveNodesParameter, сокеты назначаются слотам left/right.

@property value - Идентификатор выбранного объекта с подписью либо null.

@property [onPick] - Запрашивает выбор у приложения; новый объект не создаётся локально.
*/
export default function ReferenceParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="reference"
    connected={props.connected}
    hidden={props.hidden}
    disabled={props.disabled}
    readOnly={props.readOnly}
    title={props.title}
    style={props.style}
  >
    <slot
      name="left"
      slot="left"
    />
    <slot
      name="right"
      slot="right"
    />
    <ReferenceField
      label={props.labelHidden === true ? undefined : props.label}
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      readOnly={props.readOnly}
      density="compact"
      title={props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
      `}
      onActivate={props.onActivate}
      onPick={props.onPick}
      onClear={props.onClear}
    />
  </ParameterLayout>
}
