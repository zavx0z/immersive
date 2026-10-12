import {BufferAttribute, BufferGeometry} from "./buffer-geometry"
import {InstancedMesh} from "./instanced-mesh"
import {SkinnedMesh} from "./skinned-mesh"
import {Matrix4} from "../math"

/**
 * Instances of one skinned primitive with an independently animated pose per slot.
 *
 * Geometry and material come from `source`. Vertex/index attributes are shared;
 * instance transforms and bone palettes belong to this batch. Each slot initially
 * samples `source`; use `setPoseAt` with another rig's mesh for independent clips,
 * playback times or speeds. Animate those rigs with ordinary AnimationMixers.
 * Pose meshes may live under a hidden scene root; they need not be drawn.
 *
 * Skinning is mesh-local, followed by the instance matrix and this object's world
 * matrix. Set instance matrices explicitly, including any imported mesh transform.
 * All poses must use the same joint ordering and inverse-bind convention as source.
 * One batch draws one primitive/material; a multi-primitive model needs one batch
 * per primitive. The renderer refreshes palettes before comparing retained frames.
 * Detached rigs must have current world matrices supplied by their owner.
 *
 * Animated instance bounds are not the source geometry's static bounds, so frustum
 * culling defaults to disabled. Capacity is fixed; count may shrink and regrow.
 *
 * @example
 * ```ts
 * const batch = new InstancedSkinnedMesh(firstRigMesh, 2)
 * batch.setPoseAt(1, secondRigMesh)
 * batch.setMatrixAt(0, firstPlacement)
 * batch.setMatrixAt(1, secondPlacement)
 * space.add(batch)
 * // In the application's existing frame lifecycle:
 * firstMixer.update(deltaSeconds)
 * secondMixer.update(deltaSeconds * 0.7)
 * // Renderer samples both poses, then draws the primitive with instanceCount=2.
 * ```
 */
export class InstancedSkinnedMesh extends InstancedMesh {
  public readonly isInstancedSkinnedMesh = true
  public readonly capacity: number
  public readonly boneCount: number
  public readonly instanceBones: Float32Array
  public readonly instanceBonesAttribute: BufferAttribute
  private readonly poses: SkinnedMesh[]
  private readonly meshInverse = new Matrix4()
  private readonly boneMatrix = new Matrix4()

  constructor(source: SkinnedMesh, count: number) {
    const boneCount = source.skeleton.bones.length
    if (boneCount === 0 || boneCount > 65536 || source.skeleton.boneInverses.length !== boneCount) {
      throw new RangeError("InstancedSkinnedMesh requires 1..65536 paired bones and inverse bind matrices")
    }
    const {position, normal, skinIndex, skinWeight} = source.geometry.attributes
    if (!(position?.array instanceof Float32Array) || position.itemSize !== 3
      || !(normal?.array instanceof Float32Array) || normal.itemSize !== 3 || normal.count !== position.count
      || !(skinIndex?.array instanceof Uint16Array) || skinIndex.itemSize !== 4 || skinIndex.count !== position.count
      || !(skinWeight?.array instanceof Float32Array) || skinWeight.itemSize !== 4 || skinWeight.count !== position.count) {
      throw new TypeError("InstancedSkinnedMesh requires float32 position/normal/skinWeight and uint16 skinIndex attributes")
    }
    for (const index of skinIndex.array) {
      if (index >= boneCount) throw new RangeError("InstancedSkinnedMesh joint index exceeds the bone palette")
    }
    const geometry = new BufferGeometry()
    geometry.attributes = {...source.geometry.attributes}
    geometry.index = source.geometry.index
    super(geometry, source.material, count)
    this.capacity = count
    this.boneCount = boneCount
    this.poses = Array.from({length: count}, () => source)
    this.instanceBones = new Float32Array(count * boneCount * 16)
    this.instanceBonesAttribute = new BufferAttribute(this.instanceBones, 16)
    geometry.setAttribute("instanceBones", this.instanceBonesAttribute)
    this.frustumCulled = false
  }

  /** Selects a live pose provider without changing this instance's placement. */
  public setPoseAt(index: number, source: SkinnedMesh): void {
    this.assertIndex(index)
    if (source.skeleton.bones.length !== this.boneCount || source.skeleton.boneInverses.length !== this.boneCount) {
      throw new RangeError("Instance pose must have the batch's bone count and joint ordering")
    }
    this.poses[index] = source
  }

  /** Pose provider, also used by the renderer to synchronize hidden dependencies. */
  public getPoseAt(index: number): SkinnedMesh {
    this.assertIndex(index)
    return this.poses[index]!
  }

  /** Samples current mesh-local bone matrices and marks only changed palettes. */
  public updatePoseMatrices(): void {
    if (!Number.isInteger(this.count) || this.count < 0 || this.count > this.capacity) {
      throw new RangeError("InstancedSkinnedMesh count must be within its fixed capacity")
    }
    for (let instance = 0; instance < this.count; instance++) {
      const pose = this.poses[instance]!
      const skeleton = pose.skeleton
      if (skeleton.bones.length !== this.boneCount || skeleton.boneInverses.length !== this.boneCount) {
        throw new RangeError("Instance pose skeleton changed its bone count")
      }
      this.meshInverse.copy(pose.matrixWorld).invert()
      const start = instance * this.boneCount * 16
      let changed = false
      for (let bone = 0; bone < this.boneCount; bone++) {
        const matrix = this.boneMatrix.multiplyMatrices(this.meshInverse, skeleton.bones[bone]!.matrixWorld)
          .multiply(skeleton.boneInverses[bone]!).elements
        const offset = start + bone * 16
        for (let component = 0; component < 16; component++) {
          const value = Math.fround(matrix[component]!)
          if (this.instanceBones[offset + component] !== value) {
            this.instanceBones[offset + component] = value
            changed = true
          }
        }
      }
      if (changed) this.instanceBonesAttribute.addUpdateRange(start, this.boneCount * 16)
    }
  }

  private assertIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.capacity) {
      throw new RangeError(`Instance pose index ${index} is outside capacity ${this.capacity}`)
    }
  }
}
