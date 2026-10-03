/**
OptionGroupParameter соединяет публичный ToggleButtonGroup с композицией сокетов ноды.
Подключённый параметр сохраняет подпись и Socket, скрывая собственное поле.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import ToggleButtonGroup from "@ui-buttons/toggle-button-group"
import ParameterLayout from "@nodes-parameters/layout"
import type {NodesParametersOptionGroup as Contract} from "./contract"

export type {NodesParametersOptionGroup} from "./contract"

/**
Авторский контракт OptionGroupParameter; общий протокол описан в NodesParameters, сокеты назначаются слотам left/right.

@property options - Полный набор вариантов; в каждый момент выбран одно строковое значение.
*/
export default function OptionGroupParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="option-group"
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
    <ToggleButtonGroup
      value={props.value}
      options={props.options}
      density="compact"
      disabled={props.disabled}
      readOnly={props.readOnly}
      title={props.connected === true ? undefined : props.title}
      style={css`
        width: 0;
        min-width: 0;
        flex-grow: 1;
        --field-label-width: 18px;
      `}
      onChange={props.onChange}
    />
  </ParameterLayout>
}
