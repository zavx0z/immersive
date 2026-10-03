/**
Проецирует переданный Store параметра без копирования значения.
Функция выбирает готовый компонент параметра. Node владеет планированием
собственной геометрии; адаптер передаёт данные и обработчики,
а разметка и UI-поля принадлежат конкретным компонентам параметров.

@packageDocumentation
*/
import resolveProjectedParameterPresentation from "@nodes/parameter-presentation"
import type {NodesParameterPresentation} from "@nodes/parameter-presentation"
export {default as resolveProjectedParameterPresentation} from "@nodes/parameter-presentation"
export type ProjectedParameterPresentation = NodesParameterPresentation.Output
export type ProjectedParameterKind = NodesParameterPresentation.Output["kind"]


import type {
  NodeJsonValue,
  Socket as CoreSocket,
} from "@nodes/tree"
import {
  useMemo,
  useSyncExternalStore,
  type FunctionComponent,
} from "@zavx0z/component"
import {metadataBoolean, metadataString} from "@nodes/metadata"
import socketKey from "@socket-values/key"
import socketSide from "@socket-values/side"
import {NODE_PARAMETER_SPACING_MEDIUM, NODE_PARAMETER_SPACING_SMALL} from "../src/metrics.ts"
import resolveSocketKind from "@socket-values/resolve-kind"
import resolveSocketShape from "@socket-values/resolve-shape"
import type {ParameterProps, ParameterEndpoint} from "../src/contracts.ts"
import {CheckboxParameter} from "../../boolean/checkbox/index.tsx"
import {CollectionParameter} from "../../collection/collection/index.tsx"
import {ColorParameter} from "../../composite/color/index.tsx"
import {CycleParameter} from "../../choice/cycle/index.tsx"
import {MatrixParameter} from "../../composite/matrix/index.tsx"
import {NumberParameter} from "../../numeric/number/index.tsx"
import {OptionGroupParameter} from "../../choice/option-group/index.tsx"
import {OutputParameter} from "../../output/output/index.tsx"
import {PathParameter} from "../../reference/path/index.tsx"
import {ReferenceParameter} from "../../reference/reference/index.tsx"
import {SelectParameter} from "../../choice/select/index.tsx"
import {SliderParameter} from "../../numeric/slider/index.tsx"
import {SwitchParameter} from "../../boolean/switch/index.tsx"
import {TextParameter} from "../../text/text/index.tsx"
import {VectorParameter} from "../../composite/vector/index.tsx"

export type {ParameterProps, ParameterInput, ParameterEndpoint, ParameterBaseProps} from "../src/contracts.ts"
export {NODE_PARAMETER_SPACING_MEDIUM, NODE_PARAMETER_SPACING_SMALL} from "../src/metrics.ts"

/** Проецирует переданный Store параметра модели без копирования его значения. */
export function Parameter(props: ParameterProps) {
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
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      checked={booleanValue}
      onChange={change}
    /> : null}
    {kind === "collection" ? <CollectionParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      items={collection?.items ?? []}
      selectedId={collection?.selectedId ?? null}
      visibleRows={collection?.visibleRows}
    /> : null}
    {kind === "color" ? <ColorParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={color!}
      onInput={input}
      onChange={change}
    /> : null}
    {kind === "cycle" ? <CycleParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={stringValue}
      options={options ?? []}
      onChange={change}
    /> : null}
    {kind === "matrix" ? <MatrixParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={matrix!}
      step={rawStep}
      onInput={input}
      onChange={change}
    /> : null}
    {kind === "number" ? <NumberParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={numberValue}
      min={min}
      max={max}
      step={step}
      precision={precision}
      onInput={input}
      onChange={change}
    /> : null}
    {kind === "option-group" ? <OptionGroupParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={stringValue}
      options={options ?? []}
      onChange={change}
    /> : null}
    {kind === "output" ? <OutputParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={snapshot.value}
    /> : null}
    {kind === "path" ? <PathParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={stringValue}
      placeholder={placeholder}
      onInput={input}
      onChange={change}
    /> : null}
    {kind === "reference" ? <ReferenceParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={reference ?? null}
    /> : null}
    {kind === "select" ? <SelectParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={stringValue}
      options={options}
      onChange={change}
    /> : null}
    {kind === "slider" ? <SliderParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={numberValue}
      min={min!}
      max={max!}
      step={step}
      onInput={input}
      onChange={change}
    /> : null}
    {kind === "switch" ? <SwitchParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      checked={booleanValue}
      onChange={change}
    /> : null}
    {kind === "text" ? <TextParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={stringValue}
      placeholder={placeholder}
      onInput={input}
      onChange={change}
    /> : null}
    {kind === "vector" ? <VectorParameter
      id={snapshot.id}
      nodeId={props.nodeId}
      label={label}
      labelHidden={labelHidden}
      sockets={sockets}
      connected={connected}
      disabled={disabled}
      readOnly={readOnly}
      title={title}
      spacingBefore={props.spacingBefore}
      style={props.style}
      onSocketActivate={props.onSocketActivate}
      value={vector!}
      axes={axes}
      min={min}
      max={max}
      step={rawStep}
      onInput={input}
      onChange={change}
    /> : null}
  </>
}

export type ParameterComponent = FunctionComponent<ParameterProps>

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
