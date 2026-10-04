/**
Общая композиция готовых параметров: подпись, содержимое и сокеты.
Подключение не меняет доступность поля и размещение подписи.

@packageDocumentation
*/

import socketMetrics from "@socket-values/metrics"
const {NODE_ROW_HEIGHT} = socketMetrics
import parameterMetrics from "@nodes/parameter-metrics"
const {NODE_PARAMETER_SPACING_MEDIUM, NODE_PARAMETER_SPACING_SMALL} = parameterMetrics
import type {NodesParametersLayout as Contract} from "./contract"
import type {NodesParameters} from "@nodes/parameters/contract"
type ParameterBaseProps = NodesParameters.Input
export type {NodesParametersLayout} from "./contract"
import {hasSlot} from "@zavx0z/component/slot-presence"
import {ParameterEndpoints} from "./src/endpoint"
import {ParameterLabel} from "./src/label"

/**
Компонует подпись и сокеты вокруг поля, назначенного безымянному слоту.
Поле и сокеты остаются доступны одновременно; подключение сохраняет их экземпляры и геометрию.
*/
export default function ParameterLayout(props: Contract.Input): Contract.Output {
  validateBaseProps(props)
  const left = hasSlot("left")
  const right = hasSlot("right")
  const connected = props.connected === true
  const leadingField = props.fieldBeforeLabel === true
  const fieldOwnsLabel = props.fieldOwnsLabel === true
  const insetField = fieldOwnsLabel && left && !right
  return <div
    role="group"
    aria-label={props.label}
    data-parameter-id={props.id}
    data-field-kind={props.kind}
    data-has-sockets={left || right ? "true" : "false"}
    data-connected={connected ? "true" : undefined}
    data-label-hidden={props.labelHidden === true ? "true" : undefined}
    data-leading-checkbox={leadingField ? "true" : undefined}
    data-inset-number-row={insetField ? "true" : undefined}
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

      &[data-label-hidden="true"] {
        gap: 0;
        padding-right: 11px;
        padding-left: 12px;
      }

      &[data-leading-checkbox="true"] {
        gap: 4px;
        padding-right: 8px;
        padding-left: 8px;
      }

      &[data-inset-number-row="true"] {
        gap: 0;
        padding-right: 11px;
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
    <ParameterLabel
      label={props.label}
      hidden={props.labelHidden === true || leadingField || fieldOwnsLabel}
    />
    <span
      data-parameter-field=""
      data-leading={leadingField ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: flex;
        align-items: center;
        width: ${leadingField ? "18px" : "0"};
        min-width: 0;
        min-height: ${NODE_ROW_HEIGHT}px;
        flex-grow: ${leadingField ? 0 : 1};
      `}
    >
      <slot />
    </span>
    {leadingField ? <ParameterLabel
      label={props.label}
      hidden={props.labelHidden}
      expanded
      title={props.title}
    /> : null}
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
