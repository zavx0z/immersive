/** Метрики описывают отдельный интервал и высоту текстового вывода в одной единице. */
import {describe, expect, test} from "bun:test"
import metrics from "@immersive-nodes-geometry/parameter"

describe.each([{name: "Логические пиксели", props: {unit: "CSS px"}}])("$name", ({props}) => {
  const result = metrics
  test("Согласованные размеры", () => {
    expect(Object.values(result).every(value => Number.isFinite(value) && value > 0), props.unit).toBeTrue()
    expect(result.NODE_PARAMETER_SPACING_MEDIUM, "Средний интервал больше малого").toBeGreaterThan(result.NODE_PARAMETER_SPACING_SMALL)
    expect(result.PARAMETER_OUTPUT_HEIGHT, "Интервал не подменяет высоту строки вывода").toBeGreaterThan(result.NODE_PARAMETER_SPACING_MEDIUM)
    expect(Object.isFrozen(result), "Потребители не могут изменить общий набор").toBeTrue()
  })
})
