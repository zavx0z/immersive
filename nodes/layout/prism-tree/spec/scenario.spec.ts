/**
Одинаковое правило тела и прямоугольной развилки на каждой глубине.

@packageDocumentation
*/
import {describe, expect, test} from "bun:test"
import layoutPrismTree, {type ImmersiveNodesLayoutPrismTree as Contract} from "@zavx0z/immersive-nodes-layout-prism-tree"

describe.each([
  {name: "Один лист", props: {nodes: [{id: "root", width: 180, height: 100}]}},
  {name: "Ветвление на каждой глубине", props: {nodes: [
    {id: "root", width: 184, height: 104},
    {id: "family", parentId: "root", width: 122, height: 74},
    {id: "early-leaf", parentId: "root", width: 80, height: 48},
    {id: "child", parentId: "family", width: 80, height: 48},
  ]}},
])("$name", ({props}: {props: Contract.Input}) => {
  const result = layoutPrismTree(props)

  test("Одна поверхность и одно полное тело для каждой сущности", () => {
    expect(result.nodes, "Каждый входной предмет имеет одну поверхность").toHaveLength(props.nodes.length)
    expect(result.stems, "Каждый предмет, включая лист, имеет одно полное тело").toHaveLength(props.nodes.length)
    expect(new Set(result.nodes.map(node => node.id)).size, "Идентификаторы поверхностей не повторяются").toBe(props.nodes.length)
    for (const stem of result.stems) expect({...stem.bottom, z: stem.top.z}, "XY-сечение тела сохраняется до его нижнего торца").toEqual(stem.top)
  })

  test("Прямоугольные ветви начинаются на нижнем торце тела и заканчиваются на точном Display ребёнка", () => {
    const nodes = new Map(result.nodes.map(node => [node.id, node]))
    const bodies = new Map(result.stems.map(stem => [stem.nodeId, stem]))
    expect(result.branches, "Каждый предмет с родителем имеет одну ветвь").toHaveLength(props.nodes.filter(node => node.parentId !== undefined).length)
    for (const branch of result.branches) {
      expect(branch.from.z, "Ветвь начинается на нижнем торце тела родителя").toBe(bodies.get(branch.parentId)!.bottom.z)
      expect(branch.to, "Ветвь заканчивается точным прямоугольником ребёнка").toEqual(nodes.get(branch.childId)!.rect)
    }
  })

  test("Первый завершившийся лист опирается на землю", () => {
    const parents = new Set(props.nodes.flatMap(node => node.parentId === undefined ? [] : [node.parentId]))
    const leaves = result.nodes.filter(node => !parents.has(node.id))
    const depth = Math.min(...leaves.map(node => node.depth))
    expect(result.groundDepth, "Земля соответствует первому уровню завершившихся листьев").toBe(depth)
    for (const leaf of leaves.filter(node => node.depth === depth)) expect(result.stems.find(stem => stem.nodeId === leaf.id)!.bottom.z, "Нижний торец первого листа находится на земле Z=0").toBe(0)
  })
})
