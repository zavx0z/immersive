import {expect, test} from "bun:test"
import layout, {type ImmersiveNodesLayoutPrismTree as Contract} from "@zavx0z/immersive-nodes-layout-prism-tree"
import {verify} from "./verify.ts"

type Rect = Contract.Output["nodes"][number]["rect"]
const actual: {nodes: readonly {id: string; parentId?: string}[]} = await Bun.file(new URL("./fixture/actual-subjects.json", import.meta.url)).json()
const xy = ({z, ...rect}: Rect) => rect

for (const viewport of [{width: 1920, height: 1088}, {width: 390, height: 844}]) {
  test(`actual428 ${viewport.width}×${viewport.height}: единый шаг и одинаковая глубина тел на всех уровнях`, () => {
    const width = viewport.width * .25, height = viewport.height * .25
    const largest = Math.max(240, width, height)
    const layerGap = largest * 3, bodyDepth = largest * 1.05
    const input: Contract.Input = {nodes: actual.nodes.map(node => ({...node, width, height})),
      options: {layerGap, bodyDepth, spacing: largest * .24}}
    const result = layout(input)
    for (let depth = 1; depth < result.layers.length; depth++) {
      expect(result.layers[depth - 1]!.z - result.layers[depth]!.z).toBeCloseTo(layerGap, 8)
    }
    for (const stem of result.stems) expect(stem.top.z - stem.bottom.z).toBeCloseTo(bodyDepth, 8)
    for (const branch of result.branches) expect(branch.from.z - branch.to.z).toBeCloseTo(layerGap - bodyDepth, 8)
    const wider = layout({...input, options: {...input.options, layerGap: layerGap * 2}})
    expect(wider.nodes.map(node => ({...node, rect: xy(node.rect)}))).toEqual(result.nodes.map(node => ({...node, rect: xy(node.rect)})))
    expect(wider.branches.map(branch => ({...branch, from: xy(branch.from), to: xy(branch.to)})))
      .toEqual(result.branches.map(branch => ({...branch, from: xy(branch.from), to: xy(branch.to)})))
    for (const stem of wider.stems) expect(stem.top.z - stem.bottom.z).toBeCloseTo(bodyDepth, 8)
  })
}

test("ширина веера и taper не меняют шаг или глубину тела, первый лист остаётся на земле", () => {
  const input: Contract.Input = {nodes: [
    {id: "root", width: 20, height: 20},
    {id: "early", parentId: "root", width: 30, height: 60},
    {id: "big", parentId: "root", width: 1000, height: 800},
    ...Array.from({length: 60}, (_, n) => ({id: `leaf:${n}`, parentId: "big", width: 300, height: 100})),
  ], options: {layerGap: 40, bodyDepth: 12}}
  const result = verify(input)
  expect(result.layers.map(layer => layer.z)).toEqual([52, 12, -28])
  expect(result.stems.find(stem => stem.nodeId === "early")!.bottom.z).toBe(0)
  expect(result.stems.find(stem => stem.nodeId === "leaf:0")!.bottom.z).toBe(-40)
})

test("глубина тела положительна и меньше общего межслойного шага", () => {
  for (const bodyDepth of [0, -1, 40, 41, Infinity, NaN]) {
    expect(() => layout({nodes: [], options: {layerGap: 40, bodyDepth}})).toThrow("bodyDepth")
  }
})
