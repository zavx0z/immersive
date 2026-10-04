/**
ColorParameter соединяет публичный ColorField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import ColorField from "@immersive-ui-component-field/color"
import ParameterLayout from "@immersive-nodes-parameter-shared/layout"
import type {ImmersiveNodesParameterCompositeColor as Contract} from "./contract"

export type {ImmersiveNodesParameterCompositeColor} from "./contract"

/**
Авторский контракт ColorParameter; общий протокол описан в ImmersiveNodesParameter, сокеты назначаются слотам left/right.

@property value - Одно RGBA-значение; всплывающий выбор цвета остаётся композицией UI.

@property [open] - Управляемая видимость панели выбора цвета без изменения значения.
*/
export default function ColorParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="color"
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
    <ColorField
      label={props.labelHidden === true ? undefined : props.label}
      value={props.value}
      open={props.open}
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
      `}
      onInput={props.onInput}
      onChange={props.onChange}
      onOpenChange={props.onOpenChange}
    />
  </ParameterLayout>
}
