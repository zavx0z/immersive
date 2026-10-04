/** Размеры ноды образуют один неизменяемый набор логических CSS-пикселей. */
import {describe, expect, test} from "bun:test"
import metrics from "@immersive-nodes-geometry-node/metrics"
import socketMetrics from "@immersive-nodes-model-socket/metrics"

describe.each([{name: "Базовая геометрия", props: {border: socketMetrics.NODE_BORDER_WIDTH}}])("$name", ({props}) => {
  const result = metrics
  test("Свёрнутая высота", () => {
    expect(result.NODE_COLLAPSED_HEIGHT, "Высота учитывает заголовок и обе границы").toBe(result.NODE_HEADER_HEIGHT + 2 * props.border)
    expect(Object.values(result).every(value => value > 0 && Number.isFinite(value)), "Все размеры положительны и конечны").toBeTrue()
    expect(Object.isFrozen(result), "Размеры не изменяются потребителем").toBeTrue()
  })
})
