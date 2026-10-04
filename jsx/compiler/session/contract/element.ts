/**
Авторское JSX-значение до компиляции в готовый ComponentValue.

Поле slots является необязательным type-only marker: оно сохраняет контракт
принимающего компонента для анализа TypeScript, без runtime-регистрации.
При отсутствии контракта используется never. Значение не является DOM-узлом.

@property @immersive/jsx/element - Бренд авторского JSX.

@property @immersive/jsx/slots - Phantom-контракт принимающих областей.
*/
export interface Element<Slots extends object = never> {
  readonly "@immersive/jsx/element": true
  readonly "@immersive/jsx/slots"?: Slots
}
