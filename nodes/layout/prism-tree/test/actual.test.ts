import {expect, test} from "bun:test"
import {type ImmersiveNodesLayoutPrismTree as Contract} from "@zavx0z/immersive-nodes-layout-prism-tree"
import {verify} from "./verify.ts"

const actual: {provenance: {sha256: string; subjects: number}; nodes: readonly {id: string; parentId?: string}[]} = await Bun.file(new URL("./fixture/actual-subjects.json", import.meta.url)).json()
for (const size of [{width: 1922, height: 1126}, {width: 392, height: 882}]) {
  test(`actual428 ${size.width}×${size.height}: Display aspect и полные объёмы каждого слоя`, () => {
    expect(actual.provenance.subjects).toBe(428)
    expect(actual.provenance.sha256).toBe("a0a735d598f2c8fcdbf1bcb66ce632571c0a5bddf71575eb0047dfe82c3b4925")
    const input: Contract.Input = {nodes: actual.nodes.map(node => ({...node, ...size})), options: {spacing: 48, layerGap: 1000}}
    const result = verify(input)
    expect(result.nodes).toHaveLength(428)
    expect(result.stems).toHaveLength(428)
    expect(result.branches).toHaveLength(427)
    expect(result.groundDepth).toBeGreaterThan(0)
    expect(result.bounds.z).toBeLessThan(0)
    // Глобальная плотность слоя не является целью: каждая семья остаётся
    // в собственной области даже после завершения соседних ветвей.
    for (const layer of result.layers) {
      expect(layer.bounds.width).toBeGreaterThan(0)
      expect(layer.bounds.height).toBeGreaterThan(0)
      expect(Number.isFinite(layer.bounds.x)).toBe(true)
      expect(Number.isFinite(layer.bounds.y)).toBe(true)
    }
  })
}
