import {Link} from "../../link/index.tsx"
import type {SpatialGraphProps} from "../contract/input.ts"
import type {SpatialGraphNode} from "../contract/node.ts"
import {
  spatialContentBounds,
  spatialGraphBounds,
  SPATIAL_GRAPH_MILLIMETERS_PER_PIXEL,
} from "./geometry.ts"

/** Рисует связи и подписи; приложение размещает собственные Display по той же геометрии. */
export function SpatialGraph(props: SpatialGraphProps) {
  validate(props)
  const graph = spatialGraphBounds(props.bounds, props)
  const unit = props.millimetersPerPixel ?? SPATIAL_GRAPH_MILLIMETERS_PER_PIXEL
  const surface = spatialContentBounds(props.bounds, props)
  const labelOffset = surface.width / unit + 20
  return <>
    <display
      data-spatial-graph="true"
      width={graph.width}
      height={graph.height}
      style={css`
        width: ${Math.ceil(props.bounds.width)}px;
        height: ${Math.ceil(props.bounds.height)}px;
        translate: ${graph.x}mm 0mm ${graph.z}mm;
        rotate: x 90deg;
        background-color: transparent;
      `}
    >
      <div
        style={css`
          position: relative;
          left: ${-props.bounds.x}px;
          top: ${-props.bounds.y}px;
          width: ${Math.ceil(props.bounds.width)}px;
          height: ${Math.ceil(props.bounds.height)}px;
          overflow: visible;
        `}
      >
        {props.links.map(link => <Link
          key={link.id}
          id={link.id}
          title={link.title}
          route={link.route}
          color={link.color}
          strokeWidth={link.strokeWidth}
          markers={link.markers}
          kind={link.kind}
          from={link.from}
          to={link.to}
          startMarker={link.startMarker}
          endMarker={link.endMarker}
          startArrow={link.startArrow}
          endArrow={link.endArrow}
          disabled={link.disabled}
          hidden={link.hidden}
        />)}
        {props.nodes.map(node => <SpatialLabel
          key={node.id}
          node={node}
          labelOffset={labelOffset}
          selected={props.selectedId === node.id}
          onSelect={props.onSelect}
        />)}
      </div>
    </display>
  </>
}

function SpatialLabel(props: Readonly<{
  node: SpatialGraphNode
  labelOffset: number
  selected: boolean
  onSelect: SpatialGraphProps["onSelect"]
}>) {
  return <button
    type="button"
    data-spatial-node-id={props.node.id}
    aria-label={props.node.title}
    title={props.node.title}
    aria-pressed={String(props.selected)}
    onClick={event => props.onSelect?.(props.node.id, event)}
    style={css`
      position: absolute;
      left: ${props.node.rect.x + props.labelOffset}px;
      top: ${props.node.rect.y}px;
      width: ${Math.max(1, props.node.rect.width - props.labelOffset)}px;
      height: ${props.node.rect.height}px;
      display: block;
      padding: 0;
      border: none;
      background-color: transparent;
      color: #e2e8f0;
      font-size: 42px;
      line-height: ${props.node.rect.height}px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
      cursor: pointer;

      &[aria-pressed="true"] {
        color: #67e8f9;
      }
    `}
  >
    {props.node.title}
  </button>
}

function validate(props: SpatialGraphProps) {
  const positive = (value: number, label: string) => {
    if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${label} должен быть положительным конечным числом`)
  }
  positive(props.bounds.width, "Ширина графа")
  positive(props.bounds.height, "Высота графа")
  if (![props.bounds.x, props.bounds.y].every(Number.isFinite)) throw new TypeError("Начало графа требует конечные координаты")
  positive(props.millimetersPerPixel ?? SPATIAL_GRAPH_MILLIMETERS_PER_PIXEL, "Масштаб единиц графа")
  const content = spatialContentBounds(props.bounds, props)
  positive(content.width, "Физическая ширина Display")
  positive(content.height, "Физическая высота Display")
  const ids = new Set<string>()
  for (const node of props.nodes) {
    if (!node.id.trim() || ids.has(node.id)) throw new TypeError("SpatialGraph требует непустые уникальные id")
    if (!node.title.trim()) throw new TypeError(`Нода ${node.id} требует подпись`)
    if (![node.rect.x, node.rect.y, node.rect.width, node.rect.height].every(Number.isFinite)) throw new TypeError(`Нода ${node.id} требует конечную геометрию`)
    positive(node.rect.width, "Ширина ноды")
    positive(node.rect.height, "Высота ноды")
    ids.add(node.id)
  }
}
