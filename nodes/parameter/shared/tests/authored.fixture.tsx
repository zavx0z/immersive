/** Настоящая авторская JSX-композиция для сравнения с модельной проекцией. */
import Socket from "@zavx0z/immersive-nodes-socket"
import type {ParameterEndpoint} from "./parameter-endpoint"
import TextParameter, {type Zavx0zImmersiveNodesParameterText} from "@zavx0z/immersive-nodes-parameter-text"
import NumberParameter, {type Zavx0zImmersiveNodesParameterNumericNumber} from "@zavx0z/immersive-nodes-parameter-numeric-number"
import SliderParameter, {type Zavx0zImmersiveNodesParameterNumericSlider} from "@zavx0z/immersive-nodes-parameter-numeric-slider"
import CheckboxParameter, {type Zavx0zImmersiveNodesParameterBooleanCheckbox} from "@zavx0z/immersive-nodes-parameter-boolean-checkbox"
import SwitchParameter, {type Zavx0zImmersiveNodesParameterBooleanSwitch} from "@zavx0z/immersive-nodes-parameter-boolean-switch"
import SelectParameter, {type Zavx0zImmersiveNodesParameterChoiceSelect} from "@zavx0z/immersive-nodes-parameter-choice-select"
import CycleParameter, {type Zavx0zImmersiveNodesParameterChoiceCycle} from "@zavx0z/immersive-nodes-parameter-choice-cycle"
import OptionGroupParameter, {type Zavx0zImmersiveNodesParameterChoiceOptionGroup} from "@zavx0z/immersive-nodes-parameter-choice-option-group"
import ColorParameter, {type Zavx0zImmersiveNodesParameterCompositeColor} from "@zavx0z/immersive-nodes-parameter-composite-color"
import VectorParameter, {type Zavx0zImmersiveNodesParameterCompositeVector} from "@zavx0z/immersive-nodes-parameter-composite-vector"
import MatrixParameter, {type Zavx0zImmersiveNodesParameterCompositeMatrix} from "@zavx0z/immersive-nodes-parameter-composite-matrix"
import PathParameter, {type Zavx0zImmersiveNodesParameterPath} from "@zavx0z/immersive-nodes-parameter-path"
import ReferenceParameter, {type Zavx0zImmersiveNodesParameterReference} from "@zavx0z/immersive-nodes-parameter-reference"
import CollectionParameter, {type Zavx0zImmersiveNodesParameterCollection} from "@zavx0z/immersive-nodes-parameter-collection"
import OutputParameter, {type Zavx0zImmersiveNodesParameterOutput} from "@zavx0z/immersive-nodes-parameter-output"

export function AuthoredText(props: Zavx0zImmersiveNodesParameterText.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredNumber(props: Zavx0zImmersiveNodesParameterNumericNumber.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredSlider(props: Zavx0zImmersiveNodesParameterNumericSlider.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredCheckbox(props: Zavx0zImmersiveNodesParameterBooleanCheckbox.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredSwitch(props: Zavx0zImmersiveNodesParameterBooleanSwitch.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredSelect(props: Zavx0zImmersiveNodesParameterChoiceSelect.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredCycle(props: Zavx0zImmersiveNodesParameterChoiceCycle.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredOptionGroup(props: Zavx0zImmersiveNodesParameterChoiceOptionGroup.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredColor(props: Zavx0zImmersiveNodesParameterCompositeColor.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredVector(props: Zavx0zImmersiveNodesParameterCompositeVector.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredMatrix(props: Zavx0zImmersiveNodesParameterCompositeMatrix.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredPath(props: Zavx0zImmersiveNodesParameterPath.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredReference(props: Zavx0zImmersiveNodesParameterReference.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredCollection(props: Zavx0zImmersiveNodesParameterCollection.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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

export function AuthoredOutput(props: Zavx0zImmersiveNodesParameterOutput.Input & Readonly<{sockets: readonly ParameterEndpoint[]}>) {
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
