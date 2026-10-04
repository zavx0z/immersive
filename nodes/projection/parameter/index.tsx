/**
Проецирует переданный Store параметра без копирования значения.
Функция выбирает готовый компонент параметра. Node владеет планированием
собственной геометрии; адаптер передаёт данные и обработчики,
а разметка и UI-поля принадлежат конкретным компонентам параметров.

@packageDocumentation
*/
import {TextParameter, NumberParameter, SliderParameter, CheckboxParameter, SwitchParameter, SelectParameter, CycleParameter, OptionGroupParameter, ColorParameter, VectorParameter, MatrixParameter, PathParameter, ReferenceParameter, CollectionParameter, OutputParameter} from "@zavx0z/immersive-nodes-parameter"
import resolveProjectedParameterPresentation from "@zavx0z/immersive-nodes-projection-parameter-presentation"


import type {
  NodeJsonValue,
  Socket as CoreSocket,
} from "@zavx0z/immersive-nodes-tree"
import {
  useMemo,
  useSyncExternalStore,
} from "@zavx0z/immersive-component"
import {metadataBoolean, metadataString} from "@zavx0z/immersive-tech-json-metadata"
import socketKey from "@zavx0z/immersive-nodes-model-socket-key"
import socketSide from "@zavx0z/immersive-nodes-model-socket-side"
import parameterMetrics from "@zavx0z/immersive-nodes-geometry-parameter"
const {NODE_PARAMETER_SPACING_MEDIUM, NODE_PARAMETER_SPACING_SMALL} = parameterMetrics
import resolveSocketKind from "@zavx0z/immersive-nodes-model-socket-resolve-kind"
import resolveSocketShape from "@zavx0z/immersive-nodes-model-socket-resolve-shape"
import type {Zavx0zImmersiveNodesProjectionParameter as Contract} from "./contract"
import type {Zavx0zImmersiveNodesSocket} from "@zavx0z/immersive-nodes-socket"
type ParameterEndpoint = Readonly<Pick<Zavx0zImmersiveNodesSocket.Input, "id" | "kind" | "direction" | "side" | "label" | "title" | "shape" | "connected" | "disabled">>
import Socket from "@zavx0z/immersive-nodes-socket"
export type {Zavx0zImmersiveNodesProjectionParameter} from "./contract"


/** Проецирует переданный Store параметра модели без копирования его значения. */
export default function Parameter(props: Contract.Input): Contract.Output {
  const fallbackStore = useMemo(() => Object.freeze({
    subscribe: (_listener: () => void) => () => {},
    getSnapshot: () => props.snapshot,
  }), [props.snapshot])
  const store = props.store ?? fallbackStore
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const resolved = resolveProjectedParameterPresentation(snapshot)
  const {
    kind,
    label,
    disabled,
    readOnly,
    labelHidden,
    title,
    min,
    max,
    rawStep,
    step,
    precision,
    options,
    placeholder,
    axes,
    booleanValue,
    numberValue,
    stringValue,
    vector,
    matrix,
    color,
    reference,
    collection,
  } = resolved
  const socketIds = new Set<string>()
  for (const socket of props.sockets) {
    if (socketIds.has(socket.id)) throw new Error(`Parameter ${snapshot.id} Socket id must be unique: ${socket.id}`)
    socketIds.add(socket.id)
  }
  const sockets = props.sockets.map(socket => parameterSocket(
    socket,
    props.nodeId,
    props.connectedSocketKeys,
    props.resolvedSocketSides,
  ))
  const connected = sockets.some(socket => socket.connected === true)
  const input = (value: NodeJsonValue, event: Event) => props.onInput?.(Object.freeze({
    nodeId: props.nodeId,
    parameterId: snapshot.id,
    value,
  }), event)
  const change = (value: NodeJsonValue, event: Event) => props.onChange?.(Object.freeze({
    nodeId: props.nodeId,
    parameterId: snapshot.id,
    value,
  }), event)
  return <>
    {kind === "checkbox" ? <CheckboxParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      checked={booleanValue}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </CheckboxParameter> : null}
    {kind === "collection" ? <CollectionParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      items={collection?.items ?? []}
      selectedId={collection?.selectedId ?? null}
      visibleRows={collection?.visibleRows}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </CollectionParameter> : null}
    {kind === "color" ? <ColorParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={color!}
      onInput={input}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </ColorParameter> : null}
    {kind === "cycle" ? <CycleParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={stringValue}
      options={options ?? []}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </CycleParameter> : null}
    {kind === "matrix" ? <MatrixParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={matrix!}
      step={rawStep}
      onInput={input}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </MatrixParameter> : null}
    {kind === "number" ? <NumberParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={numberValue}
      min={min}
      max={max}
      step={step}
      precision={precision}
      onInput={input}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </NumberParameter> : null}
    {kind === "option-group" ? <OptionGroupParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={stringValue}
      options={options ?? []}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </OptionGroupParameter> : null}
    {kind === "output" ? <OutputParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={snapshot.value}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </OutputParameter> : null}
    {kind === "path" ? <PathParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={stringValue}
      placeholder={placeholder}
      onInput={input}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </PathParameter> : null}
    {kind === "reference" ? <ReferenceParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={reference ?? null}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </ReferenceParameter> : null}
    {kind === "select" ? <SelectParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={stringValue}
      options={options}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </SelectParameter> : null}
    {kind === "slider" ? <SliderParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={numberValue}
      min={min!}
      max={max!}
      step={step}
      onInput={input}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </SliderParameter> : null}
    {kind === "switch" ? <SwitchParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      checked={booleanValue}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </SwitchParameter> : null}
    {kind === "text" ? <TextParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={stringValue}
      placeholder={placeholder}
      onInput={input}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </TextParameter> : null}
    {kind === "vector" ? <VectorParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      value={vector!}
      axes={axes}
      min={min}
      max={max}
      step={rawStep}
      onInput={input}
      onChange={change}
    >
      {sockets.filter(socket => socket.side === "left").map(socket => <Socket
        key={socket.id}
        slot="left"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
      {sockets.filter(socket => socket.side === "right").map(socket => <Socket
        key={socket.id}
        slot="right"
        nodeId={props.nodeId}
        id={socket.id}
        kind={socket.kind}
        direction={socket.direction}
        side={socket.side}
        label={socket.label}
        title={socket.title}
        shape={socket.shape}
        connected={socket.connected}
        disabled={socket.disabled}
        onActivate={event => props.onSocketActivate?.(socket.id, event)}
      />)}
    </VectorParameter> : null}
  </>
}


function parameterSocket(
  socket: CoreSocket,
  nodeId: string,
  connectedSocketKeys?: ReadonlySet<string>,
  resolvedSocketSides?: ReadonlyMap<string, "left" | "right">,
): ParameterEndpoint {
  const kind = resolveSocketKind(socket.valueType?.id ?? metadataString(socket.metadata, "kind", "custom"))
  return Object.freeze({
    id: socket.id,
    kind,
    direction: socket.direction,
    side: resolvedSocketSides?.get(socketKey(nodeId, socket.id)) ?? socketSide(socket),
    label: metadataString(socket.metadata, "label", socket.id),
    title: metadataString(socket.metadata, "description", "") || undefined,
    shape: resolveSocketShape(metadataString(socket.metadata, "shape", "")),
    connected: connectedSocketKeys?.has(socketKey(nodeId, socket.id)) === true,
    disabled: metadataBoolean(socket.metadata, "disabled", false),
  })
}
