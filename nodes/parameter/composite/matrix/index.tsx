/**
MatrixParameter соединяет публичный MatrixField с композицией сокетов ноды.
Поле и Socket доступны одновременно независимо от состояния подключения.
Значение и обработчики принадлежат вызывающей стороне; компонент не создаёт Store.

@packageDocumentation
*/

import MatrixField from "@zavx0z/immersive-ui-component-field-matrix"
import ParameterLayout from "@zavx0z/immersive-nodes-parameter-shared-layout"
import type {Zavx0zImmersiveNodesParameterCompositeMatrix as Contract} from "./contract"

export type {Zavx0zImmersiveNodesParameterCompositeMatrix} from "./contract"

/**
Авторский контракт MatrixParameter; общий протокол описан в Zavx0zImmersiveNodesParameter, сокеты назначаются слотам left/right.

@property value - Квадратная числовая матрица размером 2, 3 или 4.
*/
export default function MatrixParameter(props: Contract.Input): Contract.Output {
  return <ParameterLayout
    id={props.id}
    nodeId={props.nodeId}
    label={props.label}
    labelHidden={props.labelHidden}
    spacingBefore={props.spacingBefore}
    kind="matrix"
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
    <MatrixField
      label={props.labelHidden === true ? undefined : props.label}
      value={props.value}
      step={props.step}
      density={props.density ?? "compact"}
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
    />
  </ParameterLayout>
}
