/** Настоящая авторская JSX-композиция для сравнения с модельной проекцией. */
import Socket from "@nodes/sockets"
import type {ParameterEndpoint} from "./parameter-endpoint"
import TextParameter, {type NodesParametersText} from "@nodes-parameters/text"
import NumberParameter, {type NodesParametersNumber} from "@nodes-parameters/number"
import SliderParameter, {type NodesParametersSlider} from "@nodes-parameters/slider"
import CheckboxParameter, {type NodesParametersCheckbox} from "@nodes-parameters/checkbox"
import SwitchParameter, {type NodesParametersSwitch} from "@nodes-parameters/switch"
import SelectParameter, {type NodesParametersSelect} from "@nodes-parameters/select"
import CycleParameter, {type NodesParametersCycle} from "@nodes-parameters/cycle"
import OptionGroupParameter, {type NodesParametersOptionGroup} from "@nodes-parameters/option-group"
import ColorParameter, {type NodesParametersColor} from "@nodes-parameters/color"
import VectorParameter, {type NodesParametersVector} from "@nodes-parameters/vector"
import MatrixParameter, {type NodesParametersMatrix} from "@nodes-parameters/matrix"
import PathParameter, {type NodesParametersPath} from "@nodes-parameters/path"
import ReferenceParameter, {type NodesParametersReference} from "@nodes-parameters/reference"
import CollectionParameter, {type NodesParametersCollection} from "@nodes-parameters/collection"
import OutputParameter, {type NodesParametersOutput} from "@nodes-parameters/output"

export function AuthoredText(props: NodesParametersText.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <TextParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    type={input.type}
    placeholder={input.placeholder}
    onInput={input.onInput}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </TextParameter>
}

export function AuthoredNumber(props: NodesParametersNumber.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <NumberParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    min={input.min}
    max={input.max}
    softMin={input.softMin}
    softMax={input.softMax}
    step={input.step}
    precision={input.precision}
    onInput={input.onInput}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </NumberParameter>
}

export function AuthoredSlider(props: NodesParametersSlider.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <SliderParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    min={input.min}
    max={input.max}
    step={input.step}
    onInput={input.onInput}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </SliderParameter>
}

export function AuthoredCheckbox(props: NodesParametersCheckbox.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <CheckboxParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    checked={input.checked}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </CheckboxParameter>
}

export function AuthoredSwitch(props: NodesParametersSwitch.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <SwitchParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    checked={input.checked}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </SwitchParameter>
}

export function AuthoredSelect(props: NodesParametersSelect.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <SelectParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    options={input.options}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </SelectParameter>
}

export function AuthoredCycle(props: NodesParametersCycle.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <CycleParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    options={input.options}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </CycleParameter>
}

export function AuthoredOptionGroup(props: NodesParametersOptionGroup.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <OptionGroupParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    options={input.options}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </OptionGroupParameter>
}

export function AuthoredColor(props: NodesParametersColor.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <ColorParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    onInput={input.onInput}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </ColorParameter>
}

export function AuthoredVector(props: NodesParametersVector.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <VectorParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    axes={input.axes}
    min={input.min}
    max={input.max}
    step={input.step}
    onInput={input.onInput}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </VectorParameter>
}

export function AuthoredMatrix(props: NodesParametersMatrix.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <MatrixParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    step={input.step}
    onInput={input.onInput}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </MatrixParameter>
}

export function AuthoredPath(props: NodesParametersPath.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <PathParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
    placeholder={input.placeholder}
    onInput={input.onInput}
    onChange={input.onChange}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </PathParameter>
}

export function AuthoredReference(props: NodesParametersReference.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <ReferenceParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </ReferenceParameter>
}

export function AuthoredCollection(props: NodesParametersCollection.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <CollectionParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    items={input.items}
    selectedId={input.selectedId}
    visibleRows={input.visibleRows}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </CollectionParameter>
}

export function AuthoredOutput(props: NodesParametersOutput.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
  const {sockets, ...input} = props
  return <OutputParameter
    id={input.id}
    nodeId={input.nodeId}
    label={input.label}
    labelHidden={input.labelHidden}
    spacingBefore={input.spacingBefore}
    connected={input.connected}
    hidden={input.hidden}
    disabled={input.disabled}
    readOnly={input.readOnly}
    title={input.title}
    style={props.style}
    value={input.value}
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
      selected={socket.selected}
      disabled={socket.disabled}
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
      selected={socket.selected}
      disabled={socket.disabled}
    />)}
  </OutputParameter>
}
