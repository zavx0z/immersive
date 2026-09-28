# Дальнейшее развитие слотов

Действующее распределение описано в [публичном входе Slot](../index.ts),
его [контрактах](../contract/input.ts) и
[исполняемых сценариях](../spec/scenario.spec.ts).
Синтаксис `<slot>` принадлежит JSX и не требует Shadow DOM.

## Сохранение экземпляра при смене области

Динамические имена сейчас отвергаются. Будущая смена slot должна сохранять
state, DOM identity, focus, refs и effects. Ответственность и места реализации
сохранены в [заметке Component](../../../component/notes/slot-transfer.md).
Существующий remount между областями не является выполнением этого контракта.

## Произвольная разметка через границу компонента

Передаются скомпилированные компоненты, текст, условные позиции и keyed map.
Intrinsic-поддеревья и fragments через границу component children пока не
поддерживаются production-компилятором. Их добавление требует собственного
контракта захвата выражений, CSS-владения и сценариев. Не добавлять обход
только в Headless или отдельном consumer.

[Правила размещения](../../../../storybook/archetypes/entity/notes/draft-placement.md),
[контракты](../../../../storybook/archetypes/specs/contracts/notes/draft-contracts.md)
и [руководство сценариев](../../../../storybook/archetypes/specs/scenarios/spec/scenario.spec.ts)
остаются у Archetypes. Заметка сохраняется до переноса оставшегося смысла
в реализацию и проверки по [правилу жизненного цикла](../../../../storybook/archetypes/notes/note-lifecycle.md).
