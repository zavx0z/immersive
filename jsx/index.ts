/**
Авторский JSX и автоматический protocol одного Experience.

Типы, распределение слотов, runtime, development protocol и компиляция принадлежат
самостоятельным пакетам @jsx. Этот корень связывает стандартные пути,
которые TypeScript и Bun получают из jsxImportSource: @zavx0z/jsx.

Пути jsx-runtime и jsx-dev-runtime являются обязательными входами native JSX
protocol. Они ведут непосредственно к владельцам protocol; отдельного
исполняемого фасада и дополнительного корневого API здесь нет.

@packageDocumentation
*/
