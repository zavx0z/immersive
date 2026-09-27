import type {ParameterNodeProps} from "@nodes/node/parameter"

/** Неизменяемые исходные данные числового поля для вариантов ноды. */
export const parameters: NonNullable<ParameterNodeProps["parameters"]> = [
  {id: "value", revision: 0, value: 2.5, valueType: {id: "number", version: 1}, presentation: {label: "Значение"}},
]

/** Вход и выход одного поля сохраняют самостоятельные адреса. */
export const sockets: NonNullable<ParameterNodeProps["sockets"]> = [
  {id: "in", direction: "input", parameterId: "value", side: "left"},
  {id: "out", direction: "output", parameterId: "value", side: "right"},
]
