/**
Общая композиция готовых параметров: поле и сокеты. Подпись принадлежит полю.
Подключение не меняет доступность поля и размещение подписи.

@packageDocumentation
*/

import socketMetrics from "@immersive-nodes-model-socket/metrics"
const {NODE_ROW_HEIGHT} = socketMetrics
import parameterMetrics from "@immersive-nodes-geometry/parameter"
const {NODE_PARAMETER_SPACING_MEDIUM, NODE_PARAMETER_SPACING_SMALL} = parameterMetrics
import type {ImmersiveNodesParameterSharedLayout as Contract} from "./contract"
import type {ImmersiveNodesParameter} from "@immersive-nodes/parameter/contract"
type ParameterBaseProps = ImmersiveNodesParameter.Input
export type {ImmersiveNodesParameterSharedLayout} from "./contract"
import {hasSlot} from "@immersive/component/slot-presence"
import {ParameterEndpoints} from "./src/endpoint"

/**
Размещает поле в безымянном слоте между авторскими сокетами.
Поле и сокеты остаются доступны одновременно; подключение сохраняет их экземпляры и геометрию.
*/
export default function ParameterLayout(props: Contract.Input): Contract.Output {
  validateBaseProps(props)
  const left = hasSlot("left")
  const right = hasSlot("right")
  const connected = props.connected === true
  return <div
    role="group"
    aria-label={props.label}
    data-parameter-id={props.id}
    data-field-kind={props.kind}
    data-has-sockets={left || right ? "true" : "false"}
    data-connected={connected ? "true" : undefined}
    data-label-hidden={props.labelHidden === true ? "true" : undefined}
    data-spacing-before={props.spacingBefore}
    hidden={props.hidden === true}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      min-width: 0;
      min-height: ${NODE_ROW_HEIGHT}px;
      gap: 3px;

      &[data-spacing-before="small"] {
        margin-top: ${NODE_PARAMETER_SPACING_SMALL}px;
      }

      &[data-spacing-before="medium"] {
        margin-top: ${NODE_PARAMETER_SPACING_MEDIUM}px;
      }

      &[hidden] {
        display: none;
      }

      ${props.style}
    `}
  >
    <ParameterEndpoints
      side="left"
    >
      <slot name="left" />
    </ParameterEndpoints>
    <span
      data-parameter-field=""
      style={css`
        box-sizing: border-box;
        display: flex;
        align-items: center;
        width: 0;
        min-width: 0;
        min-height: ${NODE_ROW_HEIGHT}px;
        flex-grow: 1;
      `}
    >
      <slot />
    </span>
    <ParameterEndpoints
      side="right"
    >
      <slot name="right" />
    </ParameterEndpoints>
  </div>
}

function validateBaseProps(props: ParameterBaseProps): void {
  if (props.id.trim().length === 0) throw new TypeError("Parameter id must be non-empty")
  if (props.nodeId.trim().length === 0) throw new TypeError("Parameter nodeId must be non-empty")
}
