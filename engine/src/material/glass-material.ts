import {Material, type MaterialParameters} from "./material"
import {Color} from "../math"

/** Параметры тонкой прозрачной оболочки; толщины полного замкнутого объёма здесь нет. */
export interface GlassMaterialParameters extends MaterialParameters {
  /** RGB — пропускание слоя толщиной 1 мм в sRGB; alpha — плотность оболочки, 0..1. */
  tintColor?: Color
  /** Толщина одной оболочки в мм, 0..100; по умолчанию 1. */
  thickness?: number
  /** Относительный показатель преломления, 1..3; по умолчанию 1.5. */
  ior?: number
  /** Шероховатость отражения, .08..1; по умолчанию .25. */
  roughness?: number
}

/**
Прозрачная тонкая оболочка с поглощением Beer–Lambert и отражением существующих
источников света. Tint фильтрует проходящий свет и не является свечением.
Каждая видимая грань считается оболочкой; thickness не является расстоянием
между передней и задней гранями закрытого объёма.
WebGPU объединяет оболочки без сортировки batches; отражение многослойной сцены
приближённое. Материал не моделирует преломление луча или путь внутри твёрдого объёма.
Текущий optical pipeline поддерживает обычный Mesh, включая объединённую геометрию;
InstancedMesh и SkinnedMesh отклоняются до записи GPU-команд.
*/
export class GlassMaterial extends Material {
  public override readonly isGlassMaterial = true as const
  public tintColor: Color
  public thickness: number
  public ior: number
  public roughness: number

  constructor(parameters: GlassMaterialParameters = {}) {
    super(parameters)
    this.tintColor = parameters.tintColor ?? new Color(.1, .1, .1, .2)
    this.thickness = parameters.thickness ?? 1
    this.ior = parameters.ior ?? 1.5
    this.roughness = parameters.roughness ?? .25
    this.validate()
  }

  /** Проверка нужна также перед загрузкой изменённых публичных параметров в GPU. */
  validate(): void {
    for (const channel of [this.tintColor.r, this.tintColor.g, this.tintColor.b, this.tintColor.a]) {
      if (!Number.isFinite(channel) || channel < 0 || channel > 1) throw new RangeError("GlassMaterial tintColor требует конечные RGBA от 0 до 1")
    }
    for (const [name, value, minimum, maximum] of [
      ["thickness", this.thickness, 0, 100],
      ["ior", this.ior, 1, 3],
      ["roughness", this.roughness, .08, 1],
    ] as const) {
      if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`GlassMaterial ${name} требует конечное значение от ${minimum} до ${maximum}`)
    }
  }
}
