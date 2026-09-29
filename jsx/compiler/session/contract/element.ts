/**
Авторское JSX-значение до компиляции в готовый ComponentValue.

Поле slots является необязательным type-only marker: оно сохраняет контракт
принимающего компонента для анализа TypeScript, без runtime-регистрации.
При отсутствии контракта используется never. Значение не является DOM-узлом.

@property @zavx0z/jsx/element - Бренд авторского JSX.

@property @zavx0z/jsx/slots - Phantom-контракт принимающих областей.
*/
export interface Element<Slots extends object = never> {
  readonly "@zavx0z/jsx/element": true
  readonly "@zavx0z/jsx/slots"?: Slots
}
