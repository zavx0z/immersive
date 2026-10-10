# Шаблоны

Назначение HTML, CSS и разбора деклараций описано в [публичном входе](index.ts).
Готовый формат привязок принадлежит [CompiledTemplate](compiled.ts),
статическая структура CSS — [разбору CSS](css-shape/index.ts).

Авторский JSX и проверка слотов принадлежат [JSX](../jsx/index.ts).

Один semantic Document и одни операции DOM обслуживают `html/compile` и готовые
привязки. Template меняет существующие узлы и диапазоны; состояние, hooks и
эффекты готового DOM-компонента принадлежат его сгенерированному классу. HTML grammar принадлежит
DOM, а tagged-template placeholders и кэш адресованных привязок — Template.
Узлы не копируются, дополнительный Document или scheduler не создаётся.

HTML child принимает настоящий Node, DOMGroup либо plain DOMConstruction
`{type,props,key,content,context}` с номинально отмеченным DOM constructor.
Node/Group переносится целиком без клонирования и wrapper; для Group сохраняются
граничные Comments. Передача actual объекта не передаёт Template право вызывать
его dispose. Construction создаёт actual экземпляр напрямую, обновляет его при
совпадении constructor/key и завершает только остающийся в своей области экземпляр.
Перенесённое другому получателю содержимое прежняя область не удаляет и не завершает.

Замена использует общий DOM range preflight. При отказе placement подготовленный
экземпляр очищается, raw content возвращается к прежним DOM origins и фокусу;
старое значение остаётся действующим. Atomic update самого готового класса — его
constructor ABI. ComponentRoot, ComponentValue и global legacy content adapter
в новом пути не участвуют. HTML `is` выбирает customized built-in при создании
только если записан статически; динамическая запись атрибута is не меняет класс.
