import {createRoot} from "@zavx0z/immersive-component"
import {createDocument} from "@zavx0z/immersive-dom"
import {flushDocumentLayoutObservers} from "@zavx0z/immersive-dom/geometry"
import {createDocumentInteractionController, createDocumentRenderer, hitTestProjection} from "@zavx0z/immersive-renderer-html"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import Window from "@zavx0z/immersive-ui-component-surface-window"

function Row(props: {index: number}) {
  return <div style={css`
    height: 24px;
    display: flex;
  `}>
    <span>Параметр {props.index}</span>
    <input defaultValue={`Значение ${props.index}`} />
  </div>
}
function Content(props: {rows: number}) {
  const rows = Array.from({length: props.rows}, (_, index) => index)
  return <div style={css`
    display: flex;
    flex-direction: column;
  `}>
    {rows.map(index => <Row key={index} index={index} />)}
  </div>
}
function Example(props: {rows: number}) {
  return <Window
    id="drag-window"
    title="Перемещение"
    open={true}
    onOpenChange={() => {}}
    geometry={{x: 20, y: 20, width: 600, height: 600}}
    movable={true}
    resizable={true}
  >
    <Content rows={props.rows} />
  </Window>
}
const theme = await Bun.file(new URL("../../../theme/theme.css", import.meta.url)).text()
const results = []
for (const rows of [10, 100, 500]) {
  const document = createDocument()
  const owner = document.createElement("hud")
  document.append(owner)
  const root = createRoot(owner)
  let measured = 0
  const renderer = createDocumentRenderer({document, root: owner, viewport: {width: 1000, height: 800}, styleSheets: [theme],
    textMeasurer: {measureTextAdvance(value, size) {measured++
      return value.length * size * .6
    }}})
  const input = createDocumentInteractionController({document, hitTest: hitTestProjection})
  const flush = () => {
    root.flush()
    const frame = renderer.flush()
    flushDocumentLayoutObservers(document)
    root.flush()
    return renderer.flush()
  }
  try {
    root.render(Example as unknown as CompiledTemplate<{rows: number}>, {rows})
    flush()
    const window = document.getElementById("drag-window")!
    const header = window.querySelector("[data-window-header]")!.getBoundingClientRect()
    const start = {clientX: header.x + header.width / 2, clientY: header.y + header.height / 2, pointerId: 1, button: 0}
    input.pointerDown(renderer.flush(), start)
    flush()
    const samples = []
    for (let index = 0; index < 45; index++) {
      const beforeMeasures = measured
      const time = performance.now()
      input.pointerMove(renderer.flush(), {...start, clientX: start.clientX + index * 2})
      const afterInput = performance.now()
      root.flush()
      const afterComponent = performance.now()
      renderer.flush()
      const afterLayout = performance.now()
      if (index >= 5) samples.push({inputMs: afterInput - time, componentMs: afterComponent - afterInput,
        layoutMs: afterLayout - afterComponent, totalMs: afterLayout - time, textMeasurements: measured - beforeMeasures})
    }
    input.pointerUp(renderer.flush(), {...start, clientX: start.clientX + 88})
    flush()
    const position = window.getBoundingClientRect()
    const reference = []
    const initialStyle = window.getAttribute("style") ?? ""
    for (let index = 0; index < 45; index++) {
      const beforeMeasures = measured, time = performance.now()
      window.setAttribute("style", `${initialStyle};transform:translate(${index * 2}px,0px)`)
      renderer.flush()
      if (index >= 5) reference.push({totalMs: performance.now() - time, textMeasurements: measured - beforeMeasures})
    }
    const summary = (values: readonly number[]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return {median: (sorted[19]! + sorted[20]!) / 2, p95: sorted[37]}
    }
    results.push({rows, position: {x: position.x, y: position.y}, samples, referenceTransformSamples: reference,
      summary: {total: summary(samples.map(x => x.totalMs)), layout: summary(samples.map(x => x.layoutMs)),
        component: summary(samples.map(x => x.componentMs)), transformLowerBound: summary(reference.map(x => x.totalMs)),
        measurementsPerMove: samples[0]?.textMeasurements, transformMeasurements: reference[0]?.textMeasurements}})
  } finally {root.unmount()
    input.dispose()
    renderer.dispose()
  }
}
const result = {at: new Date().toISOString(), metric: "CPU-side elapsed for actual compiled Window pointer movement, excluding GPU. Monospace synthetic text measurer counts measurement work. Direct transform is a lower-bound reference, not a second implementation of Window.", results}
if (process.env.WINDOW_DRAG_OUTPUT) await Bun.write(process.env.WINDOW_DRAG_OUTPUT, JSON.stringify(result, null, 2))
console.log(JSON.stringify(results.map(x => ({rows: x.rows, position: x.position, summary: x.summary}))))

// Standalone benchmark завершён; persistent compiler preload живёт до конца процесса.
process.exit(0)
