import {describe, expect, test} from "bun:test"
import {resolve} from "node:path"
import createJsxBunPlugin from "@jsx-compiler/bun"

const uiRoot = resolve(import.meta.dir, "..")
const root = resolve(uiRoot, "..")

Bun.plugin(createJsxBunPlugin({
  cwd: root,
  persistent: true,
  sourceRoots: [uiRoot],
}))

const [
  {default: checkboxFieldLayout},
  {default: collectionFieldLayout},
  {default: colorFieldLayout},
  {default: colorPickerFieldLayout},
  {default: cycleFieldLayout},
  {default: fieldGroupLayout},
  {default: matrixFieldLayout},
  {default: numberFieldLayout},
  {default: pathFieldLayout},
  {default: referenceFieldLayout},
  {default: selectFieldLayout},
  {default: sliderFieldLayout},
  {default: switchFieldLayout},
  {default: textFieldLayout},
  {default: vectorFieldLayout},
] = await Promise.all([
  import("@ui-fields-checkbox-field/layout"),
  import("@ui-fields-collection-field/layout"),
  import("@ui-fields-color-field/layout"),
  import("@ui-fields-color-picker-field/layout"),
  import("@ui-fields-cycle-field/layout"),
  import("@ui-fields-field-group/layout"),
  import("@ui-fields-matrix-field/layout"),
  import("@ui-fields-number-field/layout"),
  import("@ui-fields-path-field/layout"),
  import("@ui-fields-reference-field/layout"),
  import("@ui-fields-select-field/layout"),
  import("@ui-fields-slider-field/layout"),
  import("@ui-fields-switch-field/layout"),
  import("@ui-fields-text-field/layout"),
  import("@ui-fields-vector-field/layout"),
])

test("[UI-005] числовая тема полей и CSS содержат один набор точных метрик", async () => {
  const metrics = await Bun.file(resolve(uiRoot, "theme/field-metrics.json")).json() as Record<string, number>
  const theme = await Bun.file(resolve(uiRoot, "theme/theme.css")).text()
  const cssMetrics = new Map(
    [...theme.matchAll(/--(field-[a-z0-9-]+):\s*([0-9]+)(px)?;/gu)].map(match => [
      match[1]!,
      Object.freeze({value: Number(match[2]), unit: match[3] ?? ""}),
    ])
  )

  expect([...cssMetrics.keys()].sort()).toEqual(Object.keys(metrics).sort())
  for (const [name, value] of Object.entries(metrics)) {
    expect(Number.isFinite(value)).toBe(true)
    expect(value).toBeGreaterThanOrEqual(0)
    expect(cssMetrics.get(name)?.value).toBe(value)
    expect(cssMetrics.get(name)?.unit).toBe(name.endsWith("-count") ? "" : "px")
  }
})

describe("[UI-006] простые поля заранее сообщают свою точную внешнюю высоту", () => {
  test("однострочные значения", () => {
    expect(numberFieldLayout.height()).toBe(22)
    expect(textFieldLayout.height()).toBe(22)
    expect(textFieldLayout.height({label: true})).toBe(28)
    expect(sliderFieldLayout.height()).toBe(28)
    expect(sliderFieldLayout.height({density: "compact"})).toBe(22)
    expect(sliderFieldLayout.height({density: "compact", label: true})).toBe(28)
    expect(colorFieldLayout.height()).toBe(28)
  })

  test("переключатели", () => {
    expect(checkboxFieldLayout.height()).toBe(16)
    expect(checkboxFieldLayout.height({label: true})).toBe(28)
    expect(switchFieldLayout.height()).toBe(18)
    expect(switchFieldLayout.height({label: true})).toBe(28)
  })

  test("выбор", () => {
    expect(selectFieldLayout.height()).toBe(22)
    expect(selectFieldLayout.height({density: "regular"})).toBe(28)
    expect(selectFieldLayout.height({label: true})).toBe(28)
    expect(cycleFieldLayout.height()).toBe(28)
    expect(cycleFieldLayout.height({density: "compact"})).toBe(22)
    expect(cycleFieldLayout.height({density: "compact", label: true})).toBe(28)
  })

  test("составные однострочные поля", () => {
    expect(pathFieldLayout.height()).toBe(28)
    expect(pathFieldLayout.height({density: "compact"})).toBe(24)
    expect(pathFieldLayout.height({density: "compact", label: true})).toBe(28)
    expect(referenceFieldLayout.height()).toBe(28)
    expect(referenceFieldLayout.height({density: "compact"})).toBe(24)
    expect(referenceFieldLayout.height({density: "compact", label: true})).toBe(28)
    expect(fieldGroupLayout.height()).toBe(28)
    expect(fieldGroupLayout.height({density: "compact"})).toBe(22)
    expect(fieldGroupLayout.height({density: "compact", label: true})).toBe(28)
    expect(vectorFieldLayout.height()).toBe(28)
    expect(vectorFieldLayout.height({density: "compact"})).toBe(22)
    expect(vectorFieldLayout.height({density: "compact", label: true})).toBe(28)
  })
})

test("[UI-007] MatrixField учитывает каждую вертикальную строку и промежуток", () => {
  expect([2, 3, 4].map(size => matrixFieldLayout.height({size}))).toEqual([58, 88, 118])
  expect([2, 3, 4].map(size => matrixFieldLayout.height({size, density: "compact"}))).toEqual([46, 70, 94])
  expect(() => matrixFieldLayout.height({size: 1})).toThrow("integer from 2 to 4")
  expect(() => matrixFieldLayout.height({size: 5})).toThrow("integer from 2 to 4")
  expect(() => matrixFieldLayout.height({size: 2.5})).toThrow("integer from 2 to 4")
})

test("[UI-008] CollectionField учитывает список и полный столбец перестановки", () => {
  expect([1, 2, 3, 4, 5, 6, 7, 8].map(visibleRows =>
    collectionFieldLayout.height({visibleRows})
  )).toEqual([58, 58, 84, 110, 136, 162, 188, 214])
  expect([1, 2, 3, 4, 5, 6, 7, 8].map(visibleRows =>
    collectionFieldLayout.height({visibleRows, movable: true})
  )).toEqual([118, 118, 118, 118, 136, 162, 188, 214])
  expect(collectionFieldLayout.height()).toBe(84)
  expect(collectionFieldLayout.height({visibleRows: Number.NaN})).toBe(84)
  expect(collectionFieldLayout.height({visibleRows: 0})).toBe(58)
  expect(collectionFieldLayout.height({visibleRows: 9})).toBe(214)
})

test("[UI-009] ColorPickerField учитывает образец, четыре канала, промежутки, отступы и рамку", () => {
  expect(colorPickerFieldLayout.height()).toBe(178)
})

test("[UI-010] каждый владелец Field связывает публичный план со своими переменными темы", async () => {
  const owners = Object.freeze({
    "field/checkbox-field/index.tsx": ["checkboxFieldLayout", "var(--field-checkbox-height)"],
    "field/collection-field/index.tsx": ["collectionFieldLayout", "collectionVisibleRowsHeight", "var(--field-collection-action-height)"],
    "field/color-field/index.tsx": ["colorFieldLayout", "var(--field-height-regular)"],
    "field/color-picker-field/index.tsx": ["colorPickerFieldLayout", "height: var(--field-color-picker-height)"],
    "field/cycle-field/index.tsx": ["cycleFieldLayout", "var(--control-height-medium)"],
    "field/field-group/index.tsx": ["fieldGroupLayout", "var(--field-height-compact)"],
    "field/matrix-field/index.tsx": ["matrixFieldLayout", "var(--field-matrix-row-gap)"],
    "field/number-field/index.tsx": ["numberFieldLayout", "var(--control-height-medium)"],
    "field/path-field/index.tsx": ["pathFieldLayout", "var(--field-path-height-compact)"],
    "field/reference-field/index.tsx": ["referenceFieldLayout", "var(--field-reference-height-compact)"],
    "field/select-field/index.tsx": ["selectFieldLayout", "var(--control-height-medium)"],
    "field/slider-field/index.tsx": ["sliderFieldLayout", "var(--field-height-compact)"],
    "field/switch-field/index.tsx": ["switchFieldLayout", "var(--field-switch-height)"],
    "field/text-field/index.tsx": ["textFieldLayout", "var(--control-height-medium)"],
    "field/vector-field/index.tsx": ["vectorFieldLayout", "var(--field-group-content-height)"],
  })

  for (const [relativePath, requiredFragments] of Object.entries(owners)) {
    let source = await Bun.file(resolve(uiRoot, relativePath)).text()
    for await (const child of new Bun.Glob("src/**/*.{ts,tsx}").scan({cwd: resolve(uiRoot, relativePath, "..")})) source += await Bun.file(resolve(uiRoot, relativePath, "..", child)).text()
    const layoutName = requiredFragments[0]!
    const layoutPath = resolve(uiRoot, relativePath.replace("/index.tsx", "/layout/index.tsx"))
    expect(await Bun.file(layoutPath).text()).toContain(`const ${layoutName}`)
    for (const fragment of requiredFragments.slice(1)) expect(source).toContain(fragment)
  }
})
