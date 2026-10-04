/**
Конкретная нода с готовыми параметрами и сокетами.

@packageDocumentation
*/
import socketKey from "@socket-values/key"

import socketMetrics from "@socket-values/metrics"
const {NODE_BORDER_WIDTH} = socketMetrics
import {hasSlot} from "@zavx0z/component/slot-presence"
import Button from "@ui-buttons/button"
import IconButton from "@ui-buttons/icon-button"
import chevronDownIcon from "@ui-themes-icons/chevron-down"
import chevronRightIcon from "@ui-themes-icons/chevron-right"
import Parameter from "@nodes/parameter-projection"
import type {NodesParameterProjection} from "@nodes/parameter-projection"
type ParameterInput = Parameters<NonNullable<NodesParameterProjection.Input["onInput"]>>[0]
import {metadataBoolean, metadataString} from "@nodes/metadata"
import parameterSpacingBefore from "@node-geometry/spacing"
import Socket from "@nodes/sockets"
import resolveSocketKind from "@socket-values/resolve-kind"
import resolveSocketShape from "@socket-values/resolve-shape"
import nodeMetrics from "@node-geometry/metrics"
const {NODE_BODY_PADDING_TOP, NODE_BODY_PADDING_BOTTOM, NODE_ROW_GAP} = nodeMetrics
import {prepareParameterNode} from "./src/prepare.ts"
import type {NodesNodeParameter as Contract} from "./contract"
import planProjectedNodeGeometry from "@node-geometry/project"
const {NODE_HEADER_HEIGHT, NODE_MINIMUM_WIDTH} = nodeMetrics

export type {NodesNodeParameter} from "./contract"

/** Объединяет корпус, шапку, действия, параметры и сокеты. Ширина задаётся CSS, тень принадлежит общей теме или составной ContentNode. */
export default function ParameterNode(props: Contract.Input): Contract.Output {
  const {parameters, sockets, left, right} = prepareParameterNode(props, hasSlot())
  const collapseLabel = props.collapsed === true ? `Развернуть ${props.label}` : `Свернуть ${props.label}`
  const collapseIcon = props.collapsed === true ? chevronRightIcon : chevronDownIcon
  const toggleCollapse = (event: Event) => {
    event.stopPropagation()
    props.onCollapseChange?.(props.collapsed !== true, event)
  }
  const change = (value: ParameterInput, event: Event) => { if (!props.collapsed) props.onParameterInput?.(value, event) }
  const commit = (value: ParameterInput, event: Event) => { if (!props.collapsed) props.onParameterChange?.(value, event) }
  const geometry = planProjectedNodeGeometry({id: props.id, parameters, sockets}, undefined,
    props.connectedSocketKeys, props.resolvedSocketSides, {collapsed: props.collapsed})
  const headerHeight = props.collapsed ? geometry.height - 2 * NODE_BORDER_WIDTH : NODE_HEADER_HEIGHT
  return <article
    ref={props.elementRef}
    role={props.embedded ? "group" : "option"}
    tabIndex={props.embedded ? -1 : 0}
    aria-label={props.label}
    aria-selected={props.embedded ? undefined : String(props.selected === true)}
    hidden={props.hidden === true}
    data-node-id={props.embedded ? undefined : props.id}
    data-frame-id={props.embedded ? undefined : props.frameId}
    data-active={props.selected === true ? "true" : undefined}
    data-node-kind="parameter"
    data-collapsed={props.collapsed ? "true" : undefined}
    onClick={props.embedded ? undefined : props.onActivate}
    style={css`
      box-sizing: border-box;
      position: ${props.embedded ? "relative" : "absolute"};
      display: block;
      left: ${props.embedded ? 0 : props.rect?.x ?? 0}px;
      top: ${props.embedded ? 0 : props.rect?.y ?? 0}px;
      width: ${props.embedded ? "100%" : "180px"};
      height: ${props.collapsed ? `${geometry.height}px` : "auto"};
      min-width: ${NODE_MINIMUM_WIDTH}px;
      min-height: 0;
      z-index: 3;
      overflow: visible;
      border: 1px solid var(--widget-box-outline);
      border-radius: ${props.collapsed ? headerHeight / 2 : 6}px;
      background: #303030;
      color: var(--widget-box-content);
      box-shadow: ${props.embedded ? "none" : "var(--shadow-md)"};
      --node-header-height: ${headerHeight}px;

      &[data-active="true"] {
        border-color: var(--material-editor-outline-active);
      }

      &[hidden] {
        display: none;
      }

      &[data-collapsed="true"] [data-node-body] {
        position: absolute;
        left: 0;
        top: 0;
        height: var(--node-header-height);
        padding: 0;
        gap: 0;
      }

      &[data-collapsed="true"] [data-parameter-field] {
        display: none;
      }

      &[data-collapsed="true"] [data-socket-label] {
        display: none;
      }

      &[data-collapsed="true"] [data-parameter-id][data-has-sockets="false"] {
        display: none;
      }

      &[data-collapsed="true"] [data-parameter-id] {
        min-height: 0;
        height: 0;
        flex-grow: 1;
        margin-top: 0;
        padding: 0;
        gap: 0;
        justify-content: space-between;
      }

      &[data-collapsed="true"] [data-socket-id][data-presentation="row"] {
        min-height: 0;
        height: 0;
        flex-grow: 1;
        margin-top: 0;
        padding: 0;
        gap: 0;
        justify-content: space-between;
      }

      ${props.style}
    `}
  >
    <header
      data-collapsed={props.collapsed === true ? "true" : undefined}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        height: ${headerHeight}px;
        min-height: ${headerHeight}px;
        gap: 4px;
        padding: 0 5px;
        overflow: hidden;
        border-radius: var(--radius-large) var(--radius-large) 0 0;
        background: ${props.headerColor ?? "#5b466b"};
        color: #dedede;

        &[data-collapsed="true"] {
          border-radius: var(--radius-large);
        }
      `}
    >
      <Button
        label={collapseLabel}
        iconSrc={collapseIcon}
        iconOnly={true}
        variant="text"
        size="small"
        aria-label={collapseLabel}
        aria-expanded={String(props.collapsed !== true)}
        title={collapseLabel}
        disabled={props.onCollapseChange === undefined}
        onClick={toggleCollapse}
      />
      <strong
        data-node-label=""
        title={props.title}
        style={css`
          display: block;
          min-width: 0;
          flex-grow: 1;
          overflow: hidden;
          color: #dedede;
          font-size: var(--font-size-sm);
          font-weight: 600;
          white-space: nowrap;
          text-overflow: ellipsis;
        `}
      >
        {props.label}
      </strong>
      <small
        hidden={props.category === undefined}
        style={css`
          display: block;
          flex-shrink: 0;
          color: rgba(255, 255, 255, .68);
          font-size: 9px;
          white-space: nowrap;

          &[hidden] {
            display: none;
          }
        `}
      >
        {props.category ?? ""}
      </small>
      {(props.actions ?? []).map(action => <IconButton
        key={action.id}
        label={action.label}
        iconSrc={action.iconSrc}
        selected={action.selected}
        disabled={action.disabled}
        size="small"
        onClick={event => {
          event.stopPropagation()
          action.onClick?.(event)
        }}
      />)}
    </header>
    <section
      aria-label={`${props.label} body`}
      data-node-body=""
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: auto;
        margin-left: ${-NODE_BORDER_WIDTH}px;
        margin-right: ${-NODE_BORDER_WIDTH}px;
        min-width: 0;
        gap: ${NODE_ROW_GAP}px;
        padding: ${NODE_BODY_PADDING_TOP}px 0 ${NODE_BODY_PADDING_BOTTOM}px;

        &[hidden] {
          display: none;
        }
      `}
    >
      {right.map(socket => <Socket
        key={socket.id}
        id={socket.id}
        nodeId={props.id}
        kind={resolveSocketKind(socket.valueType?.id ?? metadataString(socket.metadata, "kind", "custom"))}
        direction={socket.direction}
        side="right"
        label={metadataString(socket.metadata, "label", socket.id)}
        shape={resolveSocketShape(metadataString(socket.metadata, "shape", ""))}
        connected={props.connectedSocketKeys?.has(socketKey(props.id, socket.id)) === true}
        disabled={metadataBoolean(socket.metadata, "disabled", false)}
        presentation="row"
        style={css`
          width: auto;
          align-self: stretch;
          margin-left: ${NODE_BORDER_WIDTH}px;
          margin-right: ${NODE_BORDER_WIDTH}px;

          ${props.collapsed && css`
            height: 0;
            min-height: 0;
            flex-grow: 1;
          `}
        `}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {parameters.map(parameter => <Parameter
        key={parameter.id}
        nodeId={props.id}
        snapshot={parameter}
        sockets={sockets.filter(socket => socket.parameterId === parameter.id)}
        store={props.parameterStore?.(parameter.id)}
        connectedSocketKeys={props.connectedSocketKeys}
        resolvedSocketSides={props.resolvedSocketSides}
        spacingBefore={parameterSpacingBefore(parameter)}
        onInput={change}
        onChange={commit}
        onSocketActivate={props.onSocketActivate}
      />)}
      <slot />
      {left.map(socket => <Socket
        key={socket.id}
        id={socket.id}
        nodeId={props.id}
        kind={resolveSocketKind(socket.valueType?.id ?? metadataString(socket.metadata, "kind", "custom"))}
        direction={socket.direction}
        side="left"
        label={metadataString(socket.metadata, "label", socket.id)}
        shape={resolveSocketShape(metadataString(socket.metadata, "shape", ""))}
        connected={props.connectedSocketKeys?.has(socketKey(props.id, socket.id)) === true}
        disabled={metadataBoolean(socket.metadata, "disabled", false)}
        presentation="row"
        style={css`
          width: auto;
          align-self: stretch;
          margin-left: ${NODE_BORDER_WIDTH}px;
          margin-right: ${NODE_BORDER_WIDTH}px;

          ${props.collapsed && css`
            height: 0;
            min-height: 0;
            flex-grow: 1;
          `}
        `}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </section>
  </article>
}
