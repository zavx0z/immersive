/** Настоящая авторская JSX-композиция для сравнения с модельной проекцией. */
import Socket from "@zavx0z/immersive-nodes-socket"
import type {ParameterEndpoint} from "./parameter-endpoint"
import TextParameter, {type ImmersiveNodesParameterText} from "@zavx0z/immersive-nodes-parameter-text"
import NumberParameter, {type ImmersiveNodesParameterNumericNumber} from "@zavx0z/immersive-nodes-parameter-numeric-number"
import SliderParameter, {type ImmersiveNodesParameterNumericSlider} from "@zavx0z/immersive-nodes-parameter-numeric-slider"
import CheckboxParameter, {type ImmersiveNodesParameterBooleanCheckbox} from "@zavx0z/immersive-nodes-parameter-boolean-checkbox"
import SwitchParameter, {type ImmersiveNodesParameterBooleanSwitch} from "@zavx0z/immersive-nodes-parameter-boolean-switch"
import SelectParameter, {type ImmersiveNodesParameterChoiceSelect} from "@zavx0z/immersive-nodes-parameter-choice-select"
import CycleParameter, {type ImmersiveNodesParameterChoiceCycle} from "@zavx0z/immersive-nodes-parameter-choice-cycle"
import OptionGroupParameter, {type ImmersiveNodesParameterChoiceOptionGroup} from "@zavx0z/immersive-nodes-parameter-choice-option-group"
import ColorParameter, {type ImmersiveNodesParameterCompositeColor} from "@zavx0z/immersive-nodes-parameter-composite-color"
import VectorParameter, {type ImmersiveNodesParameterCompositeVector} from "@zavx0z/immersive-nodes-parameter-composite-vector"
import MatrixParameter, {type ImmersiveNodesParameterCompositeMatrix} from "@zavx0z/immersive-nodes-parameter-composite-matrix"
import PathParameter, {type ImmersiveNodesParameterPath} from "@zavx0z/immersive-nodes-parameter-path"
import ReferenceParameter, {type ImmersiveNodesParameterReference} from "@zavx0z/immersive-nodes-parameter-reference"
import CollectionParameter, {type ImmersiveNodesParameterCollection} from "@zavx0z/immersive-nodes-parameter-collection"
import OutputParameter, {type ImmersiveNodesParameterOutput} from "@zavx0z/immersive-nodes-parameter-output"

export function AuthoredText(props: ImmersiveNodesParameterText.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredNumber(props: ImmersiveNodesParameterNumericNumber.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredSlider(props: ImmersiveNodesParameterNumericSlider.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredCheckbox(props: ImmersiveNodesParameterBooleanCheckbox.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredSwitch(props: ImmersiveNodesParameterBooleanSwitch.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredSelect(props: ImmersiveNodesParameterChoiceSelect.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredCycle(props: ImmersiveNodesParameterChoiceCycle.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredOptionGroup(props: ImmersiveNodesParameterChoiceOptionGroup.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredColor(props: ImmersiveNodesParameterCompositeColor.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredVector(props: ImmersiveNodesParameterCompositeVector.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredMatrix(props: ImmersiveNodesParameterCompositeMatrix.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredPath(props: ImmersiveNodesParameterPath.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredReference(props: ImmersiveNodesParameterReference.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredCollection(props: ImmersiveNodesParameterCollection.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredOutput(props: ImmersiveNodesParameterOutput.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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
