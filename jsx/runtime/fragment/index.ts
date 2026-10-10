/**
Единая identity группы соседних JSX-значений.
Обычный и development protocol используют тот же Fragment без второго объекта.

@packageDocumentation
*/

/** Маркер группы; содержимое обрабатывает JSX compiler. */
const Fragment = Symbol("JSX.Fragment")

export default Fragment
