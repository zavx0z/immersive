/**
Произвольное содержимое вместе с нодой с параметрами.

@packageDocumentation
*/

import Pane from "@ui-surfaces/pane"
import visibilityOnIcon from "@ui-themes-icons/visibility-on"
import {ParameterNode} from "../parameter/index.tsx"
import type {ContentNodeProps} from "./contract/input.ts"
import {planProjectedNodeGeometry} from "../shared/geometry.ts"

export type {ContentNodeProps} from "./contract/input.ts"

/** Квадратная область содержимого и ParameterNode образуют одну ноду графа с общей тенью из темы. */
export function ContentNode(props: ContentNodeProps) {
  const visible = props.contentVisible !== false
  const geometry = planProjectedNodeGeometry({id: props.id, parameters: props.parameters ?? [], sockets: props.sockets ?? []}, undefined,
    props.connectedSocketKeys, props.resolvedSocketSides, {collapsed: props.collapsed, contentVisible: visible})
  const actions = [...(props.actions ?? []), {
    id: "content-toggle",
    label: visible ? "Скрыть содержимое" : "Показать содержимое",
    iconSrc: visibilityOnIcon,
    selected: visible,
    disabled: props.onContentVisibleChange === undefined,
    onClick: (event: Event) => props.onContentVisibleChange?.(!visible, event),
  }]
  return <article
    ref={props.elementRef}
    role="option"
    tabIndex={0}
    aria-label={props.label}
    aria-selected={String(props.selected === true)}
    hidden={props.hidden === true}
    data-node-id={props.id}
    data-frame-id={props.frameId}
    data-node-kind="content"
    data-content-visible={String(visible)}
    data-parameters-collapsed={String(props.collapsed === true)}
    onClick={props.onActivate}
    style={css`
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      left: ${props.rect?.x ?? 0}px;
      top: ${props.rect?.y ?? 0}px;
      width: 180px;
      height: auto;
      min-width: 100px;
      min-height: 0;
      overflow: visible;
      z-index: 3;
      border-radius: ${!visible && props.collapsed ? geometry.height / 2 : 6}px;
      box-shadow: var(--shadow-md);

      &[hidden] {
        display: none;
      }

      ${props.style}
    `}
  >
    <div
      hidden={!visible}
      data-node-content=""
      aria-label={`${props.label}: содержимое`}
      style={css`
        width: 100%;
        aspect-ratio: 1;
        flex-shrink: 0;

        &[hidden] {
          display: none;
        }
      `}
    >
      <Pane
        active={props.selected}
        style={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
          padding: 0;
          border-radius: 6px 6px 0 0;
        `}
      >
        <slot />
      </Pane>
    </div>
    <ParameterNode
      id={props.id}
      frameId={props.frameId}
      label={props.label}
      title={props.title}
      category={props.category}
      headerColor={props.headerColor}
      selected={props.selected}
      collapsed={props.collapsed}
      parameters={props.parameters}
      sockets={props.sockets}
      parameterStore={props.parameterStore}
      connectedSocketKeys={props.connectedSocketKeys}
      resolvedSocketSides={props.resolvedSocketSides}
      onCollapseChange={props.onCollapseChange}
      onParameterInput={props.onParameterInput}
      onParameterChange={props.onParameterChange}
      onSocketActivate={props.onSocketActivate}
      embedded
      actions={actions}
    />
  </article>
}
