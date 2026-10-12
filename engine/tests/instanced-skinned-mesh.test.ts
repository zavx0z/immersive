import {expect, test} from "bun:test"
import {AnimationClip, AnimationMixer, BufferAttribute, BufferGeometry, InstancedSkinnedMesh, KeyframeTrack, Matrix4, MeshLambertMaterial, Object3D, Skeleton, SkinnedMesh, Vector3} from "../src/index"

function rig() {
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, 1]), 3))
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array([0, -1, 0, 0, -1, 0, 0, -1, 0]), 3))
  geometry.setAttribute("skinIndex", new BufferAttribute(new Uint16Array(12), 4))
  geometry.setAttribute("skinWeight", new BufferAttribute(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]), 4))
  const root = new Object3D()
  const bone = new Object3D()
  bone.name = "joint"
  const mesh = new SkinnedMesh(geometry, new MeshLambertMaterial(), new Skeleton([bone], [new Matrix4()]))
  root.add(bone)
  root.add(mesh)
  const mixer = new AnimationMixer(root)
  const clip = new AnimationClip("move", 2, [new KeyframeTrack("joint", "vector", new Float32Array([0, 2]), new Float32Array([0, 0, 0, 20, 0, 0]))])
  const action = mixer.clipAction(clip).play()
  return {root, bone, mesh, mixer, action}
}

test("independent mixer times produce distinct mesh-local palettes in one batch", () => {
  const a = rig(), b = rig()
  a.root.position.x = 100
  b.root.position.x = -100
  a.mixer.update(.25)
  b.mixer.update(.75)
  a.root.updateWorldMatrix()
  b.root.updateWorldMatrix()
  const batch = new InstancedSkinnedMesh(a.mesh, 2)
  batch.setPoseAt(1, b.mesh)
  batch.position.x = 900
  batch.setPositionAt(1, new Vector3(40, 0, 0))
  batch.updatePoseMatrices()
  expect(batch.instanceBones[12]).toBeCloseTo(2.5)
  expect(batch.instanceBones[28]).toBeCloseTo(7.5)
  expect(batch.instanceMatrix[28]).toBe(40)
  expect(batch.frustumCulled).toBe(false)
  const version = batch.instanceBonesAttribute.version
  batch.instanceBonesAttribute.needsUpdate = false
  batch.updatePoseMatrices()
  expect(batch.instanceBonesAttribute.version).toBe(version)
  b.mixer.update(.25)
  b.root.updateWorldMatrix()
  batch.updatePoseMatrices()
  expect(batch.instanceBones[12]).toBeCloseTo(2.5)
  expect(batch.instanceBones[28]).toBeCloseTo(10)
  expect(batch.instanceBonesAttribute.updateRanges).toEqual([{offset: 16, count: 16}])
})

test("source geometry is shared without leaking batch-owned attributes between batches", () => {
  const {mesh} = rig()
  const a = new InstancedSkinnedMesh(mesh, 2), b = new InstancedSkinnedMesh(mesh, 3)
  expect(a.geometry).not.toBe(mesh.geometry)
  expect(a.geometry.attributes.position).toBe(mesh.geometry.attributes.position)
  expect(a.material).toBe(mesh.material)
  expect(mesh.geometry.attributes.instanceMatrix).toBeUndefined()
  expect(mesh.geometry.attributes.instanceBones).toBeUndefined()
  expect(a.geometry.attributes.instanceMatrix).not.toBe(b.geometry.attributes.instanceMatrix)
  expect(a.instanceBones).not.toBe(b.instanceBones)
})

test("capacity and palette changes fail explicitly; zero and regrown counts remain valid", () => {
  const {mesh} = rig()
  const batch = new InstancedSkinnedMesh(mesh, 2)
  expect(() => batch.setPoseAt(2, mesh)).toThrow(RangeError)
  batch.count = 3
  expect(() => batch.updatePoseMatrices()).toThrow(RangeError)
  batch.count = 0
  batch.updatePoseMatrices()
  batch.count = 2
  batch.updatePoseMatrices()
  expect(batch.instanceBones[0]).toBe(1)
  expect(batch.instanceBones[16]).toBe(1)
  mesh.skeleton.boneInverses = []
  expect(() => batch.updatePoseMatrices()).toThrow(RangeError)
  expect(() => new InstancedSkinnedMesh(mesh, 1)).toThrow(RangeError)
})

test("invalid joint indices are rejected before GPU storage can read another instance's palette", () => {
  const {mesh} = rig()
  mesh.geometry.attributes.skinIndex!.array[0] = 1
  expect(() => new InstancedSkinnedMesh(mesh, 2)).toThrow("joint index")
})
