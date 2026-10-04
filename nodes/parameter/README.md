# Параметры

`@zavx0z/immersive-nodes-parameter` — Cluster готовых параметров и `ParameterLayout` для собственного поля.
Именованный вход сохраняет самостоятельные реализации участников. Общий протокол
`Zavx0zImmersiveNodesParameter.Input` задаёт адрес, подпись и внешнее состояние;
участники расширяют его типом значения и событиями. `Zavx0zImmersiveNodesParameter.Output`
сохраняет JSX-представление в Document приложения. Общий `Zavx0zImmersiveNodesParameter.Slots`
принимает независимые `Socket` в именованные области `left` и `right`; Socket
владеет своим адресом, состоянием и обработчиком. Пустой слот не создаёт сокет.

Каждый компонент доступен также через своего владельца `@nodes-parameters/*`
как default и собственный namespace. Разметка находится в его `index.tsx`,
протокол — в `contract/index.ts`, собственные сценарии — в `spec`.
`ParameterLayout` размещает поле в безымянном слоте и авторские Socket
в именованных слотах `left` и `right`. Подпись передаётся самому Field; отдельной подписи в Layout нет.

Проекция модели принадлежит `@zavx0z/immersive-nodes-projection-parameter`. Она подписывается
на переданный Store и выбирает те же готовые компоненты. Подготовка данных
принадлежит `@zavx0z/immersive-nodes-projection-parameter-presentation`, числовые размеры —
`@zavx0z/immersive-nodes-geometry-parameter`; Node использует этих же владельцев в расчёте геометрии.

Готовые компоненты сохраняют `labelHidden`, `spacingBefore`, состояние подключения
и точные ID сокетов. Несколько сокетов одной стороны допустимы. Автор сохраняет уникальность их ID;
модельная проекция проверяет повтор ID до создания представления.
Поле и сокеты доступны одновременно. Подключение не скрывает поле, не блокирует ручной ввод и сохраняет Element.

`OutputParameter` показывает значение только для чтения. Направление соединения
задаётся отдельно у Socket; имя компонента не обозначает выходной сокет.

[Проверки проекции](shared/tests/projection.test.ts) сопоставляют DOM и CSS всех
15 готовых компонентов с отображением из модели, проверяют адресованный ввод,
сохранение полей при обновлении и очистку подписок. Общий сценарий проверяет
15 полей и пользовательскую композицию через именованный API Cluster.

```tsx
<ParameterNode
  id="source"
  label="Источник"
>
  <TextParameter
    id="text"
    nodeId="source"
    label="Текст"
    value="Пример"
  >
    <Socket
      slot="left"
      id="in"
      nodeId="source"
      kind="string"
      direction="input"
      side="left"
      label="Вход"
    />
  </TextParameter>
  <NumberParameter
    id="scale"
    nodeId="source"
    label="Масштаб"
    value={1}
  />
</ParameterNode>
```
