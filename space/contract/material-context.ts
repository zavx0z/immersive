/** Browser передаёт разрешённый CSS каскад ресурса без private Renderer state. */
export type XRMaterialProjectionContext = Readonly<{
  color: Readonly<{r: number; g: number; b: number; a: number}>
  opacity: number
  customProperties: Readonly<Record<string, string>>
}>
