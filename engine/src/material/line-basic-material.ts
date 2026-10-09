import { Color } from "../math"
import { Material, type MaterialParameters } from "./material"

/**
 * Параметры для создания {@link LineBasicMaterial}.
 */
export interface LineBasicMaterialParameters extends MaterialParameters {
  /**
   * Цвет линии в формате RGB.
   * @default 0xffffff
   */
  color?: number | Color
  /**
   * Прозрачность материала (0.0 - полностью прозрачный, 1.0 - полностью непрозрачный).
   * @default 1.0
   */
  opacity?: number
  /**
   * Расстояние затухания в мм; 0 сохраняет цвет и alpha при любой дистанции.
   * По умолчанию 5000 для сохранения прежнего отображения существующих линий.
   */
  distanceFade?: number
}

/**
 * Базовый материал для отрисовки линий.
 */
export class LineBasicMaterial extends Material {
  /** @default new Color(0xffffff) */
  public color: Color
  /** @default 1.0 */
  public opacity: number
  private _distanceFade = 5000

  /** Расстояние затухания в мм; 0 отключает его независимо от ViewPoint. */
  public get distanceFade(): number { return this._distanceFade }
  public set distanceFade(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 0 && !Number.isFinite(Math.fround(1 / value))) {
      throw new RangeError("distanceFade требует 0 либо положительное конечное расстояние с конечным Float32 коэффициентом")
    }
    this._distanceFade = value
  }

  /**
   * @param parameters - Параметры материала.
   */
  constructor(parameters: LineBasicMaterialParameters = {}) {
    super(parameters)
    if (parameters.color instanceof Color) {
      this.color = parameters.color.clone()
    } else {
      this.color = new Color(parameters.color ?? 0xffffff)
    }
    this.opacity = parameters.opacity ?? 1.0
    this.distanceFade = parameters.distanceFade ?? 5000
  }
}
