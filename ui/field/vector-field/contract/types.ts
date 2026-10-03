import type {UiFieldsFieldGroup} from "@ui-fields/field-group"
type FieldGroupDensity = NonNullable<UiFieldsFieldGroup.Input["density"]>

/**
Тип VectorFieldDensity принадлежит контракту своего владельца.
*/
export type VectorFieldDensity = FieldGroupDensity
