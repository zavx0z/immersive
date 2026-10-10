# Авторство компонентов

`@zavx0z/immersive-component` предоставляет hooks, context и композицию для
компилятора JSX. Эти функции не исполняются в приложении: пропущенная компиляция
завершается явной ошибкой. Здесь нет ComponentInstance, общего исполнителя
hooks, планировщика, ComponentRoot или componentElement adapter.

Закон: состояние и конкретные методы готового компонента принадлежат самому
Element либо DOMGroup для нескольких корней. Document владеет подключением,
переносом, событиями и общей очередью задач. JSX, hooks и slots являются
авторской записью этого поведения и не требуют отдельного runtime.

Готовый constructor принимает `(document, props, content?, context?)`. Объект
можно передать непосредственно в `parent.append`; `createDomRoot` из DOM/core
является необязательным способом владеть местом вставки. Одиночный intrinsic
использует настоящий Element, включая результат document factory; fragment,
component-return и корневой slot сохраняют настоящий DOMGroup без host.
Физическое перемещение сохраняет Nodes, listeners, focus и hook state.

Readonly props facade читает текущие поля owner. Native alias допускается
только при доказанном соответствии исходного выражения действующему DOM binding
channel. История authored commands и render/memo не становится вторым текущим
состоянием native поля. Изменения native aliases обновляют зависимые операции
через тот же DOM lifecycle; собственные binding writes подавляют обратную
инвалидацию. Внешние stores используют transaction того же Document.

`content` — readonly map принимающих outlet names; пустая строка обозначает
безымянную область. Значения содержат реальные Nodes, DocumentFragment,
DOMGroup, инертные construction records, текст и фиксированные группы.
Fragment раскрывается при конкретном назначении; props update сохраняет его
Nodes только пока это текущий принятый input. После clear новое назначение
уже пустого Fragment остаётся пустым.
Cleanup прежнего диапазона не удаляет Node, явно переданный другому владельцу.

Известный HTML constructor можно зарегистрировать как customized builtin тем
же классом. Его первое подключение принимает исходные childNodes в объявленные
slots по атрибуту `slot`; явный content с исходными детьми не смешивается.
Отказ подготовки или native вставки сохраняет прежние props/content и дерево;
initial failure сохраняет исходный Node и разрешает retry. Ошибка cleanup
прежнего child после принятия native изменений не отменяет новое дерево:
учёт принятого input и очистка остальных прежних children завершаются, ошибка
возвращается вызывающему. Disconnect освобождает effects/refs,
reconnect сохраняет DOM и state. Это одно фактическое дерево, без Shadow DOM.
Dispose сначала отключает собственный DOM, затем очищает потомков и private
значения в одной transaction того же Document; ошибка cleanup не прерывает
очистку остальных принадлежащих компоненту ресурсов.
Factory-backed неизвестный root сохраняет native prototype и identity; HTML
CustomElementRegistry для этого режима не заявляется. Пространственные Elements
и DOMGroup используют тот же внутренний DOM lifecycle как расширение Immersive.

Проверки находятся в `tests`, `slot/test` и `slot-presence/test`: исходный fixture
действительно компилируется и исполняется через DOM, без ручных template executor
fixtures. `compatibility.json` сохраняет reference ledger React; прежние
подтверждения generic runtime переведены в unverified до проверки точного
reference case. Успешные owner tests не объявляют полную совместимость с React
или браузером. Произвольные пользовательские JS effects не являются откатываемой
DOM mutation; HMR здесь не реализован.
