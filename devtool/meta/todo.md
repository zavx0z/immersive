# Исследование стоимости инспекции больших деревьев

* [ ] Проверить ограничение обхода и сериализации при bounded inspect / поиске цели.

В CPU-профиле взаимодействия через MCP на большом дереве замечены около 820 мс
GC, 692 мс обхода `visit` и 250 мс `resolveTarget`. Это стоимость инструментальной
инспекции, не измерение обычного ввода пользователя и не доказательство дефекта
самого Devtool. Сначала воспроизвести и определить часть затрат этого владельца.
`resolveTarget` принадлежит
[App Agent Bridge](../../../storybook/app/web/page/agent-bridge/src/actions.ts),
а полный обход `visit` — этому Inspector. Их затраты не следует объединять
в один дефект движка.

[Inspector](../inspector.ts),
[interaction.cpuprofile](research/2026-10-04/interaction.cpuprofile), [current.cpuprofile](research/2026-10-04/current.cpuprofile),
[current.json](research/2026-10-04/current.json). Профили можно загрузить в Chrome DevTools Performance.
Методика: `interaction.ts.txt`, `inspect.ts.txt` рядом; профилирование само влияет
на процесс. [Размер исходного semantic дерева](../../ui/component/view/code-editor/meta/todo.md).

Готовность: ограниченный запрос инспекции не строит ненужный полный ответ;
точный поиск цели сохраняет identity и семантику, лимиты действительно ограничивают
работу. Проверить большое скрытое поддерево и широкое видимое дерево отдельно.
