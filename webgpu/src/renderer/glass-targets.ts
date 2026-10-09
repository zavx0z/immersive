/** Два single-sample FP16 attachments и один снимок opaque; не зависят от числа batches. */
export type GlassTargets = Readonly<{
  width: number
  height: number
  format: GPUTextureFormat
  textures: readonly GPUTexture[]
  opaqueView: GPUTextureView
  accumulationViews: readonly [GPUTextureView, GPUTextureView]
  compositeGroup: GPUBindGroup
  depthGroup: GPUBindGroup
}>

/** Размер resident textures без ранее существующего opaque MSAA/depth: 20 байт/pixel. */
export const glassTargetBytes = (width: number, height: number) => width * height * 20

export function createGlassTargets(device: GPUDevice, width: number, height: number, format: GPUTextureFormat, compositeLayout: GPUBindGroupLayout, depthLayout: GPUBindGroupLayout, depthView: GPUTextureView): GlassTargets {
  if (![width, height].every(value => Number.isSafeInteger(value) && value > 0 && value <= device.limits.maxTextureDimension2D)) throw new RangeError("Размер стеклянного прохода превышает GPU limits")
  const textures: GPUTexture[] = []
  const allocate = (format: GPUTextureFormat, label: string) => {
    const texture = device.createTexture({label, size: [width, height], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING})
    textures.push(texture)
    return texture.createView()
  }
  try {
    const opaqueView = allocate(format, "glass-opaque-snapshot")
    const depth = allocate("rgba16float", "glass-optical-depth")
    const reflection = allocate("rgba16float", "glass-reflection")
    return {width, height, format, textures, opaqueView, accumulationViews: [depth, reflection],
      compositeGroup: device.createBindGroup({layout: compositeLayout, entries: [
        {binding: 0, resource: opaqueView}, {binding: 1, resource: depth}, {binding: 2, resource: reflection},
      ]}),
      depthGroup: device.createBindGroup({layout: depthLayout, entries: [{binding: 0, resource: depthView}]}),
    }
  } catch (error) {
    destroyGlassTargets({textures})
    throw error
  }
}

export function destroyGlassTargets(target: Pick<GlassTargets, "textures"> | null | undefined): void {
  for (const texture of target?.textures ?? []) texture.destroy()
}
