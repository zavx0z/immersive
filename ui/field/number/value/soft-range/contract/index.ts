import type {Zavx0zImmersiveUiFieldNumberValueNormalize} from "@zavx0z/immersive-ui-field-number-value-normalize"
type NumberValueOptions = NonNullable<Zavx0zImmersiveUiFieldNumberValueNormalize.Input[1]>


/** Определение мягкого числового диапазона. */
export declare namespace Zavx0zImmersiveUiFieldNumberValueSoftRange {
  /** Аргументы публичной операции resolveNumberSoftRange; порядок сохраняет её форму вызова. */
  type Input = readonly [
    value: number,
    options?: NumberValueOptions
  ]

  /** Результат публичной операции. */
  type Output = Readonly<{min: number, max: number}>
}
