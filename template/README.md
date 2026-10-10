# Шаблоны

Назначение HTML, CSS и разбора деклараций описано в [публичном входе](index.ts).
Готовый формат привязок принадлежит [CompiledTemplate](compiled.ts),
статическая структура CSS — [разбору CSS](css-shape/index.ts).

Авторский JSX и проверка слотов принадлежат [JSX](../jsx/index.ts).

Один semantic Document и одни операции DOM обслуживают `html/compile` и готовые
привязки Component. Template меняет существующие узлы и диапазоны; состояние,
hooks и lifecycle компонентов остаются у Component. HTML grammar принадлежит
DOM, а tagged-template placeholders и кэш адресованных привязок — Template.
Узлы не копируются, дополнительный Document или scheduler не создаётся.
