import type {ComponentValue} from "@zavx0z/component"

/**
Подготовленное значение Component, возвращаемое native JSX protocol.
Brand, template, props, key и context принадлежат контракту Component;
JSX protocol сохраняет этот формат без дополнительной обёртки.
*/
export type RuntimeOutput = ComponentValue
