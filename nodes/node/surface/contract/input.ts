import type {NodePreviewImage} from "../../shared/contracts.ts"

/**
Вход {@link @nodes/node/surface#ContentSurface | ContentSurface} для области содержимого ноды.
Размеры задаёт родитель; содержимое за границами области обрезается.
Авторский JSX передаётся между тегами в безымянный слот того же semantic Document.
Непустое назначение имеет приоритет над изображением.

@property [image] - Предпросмотр, показываемый только при пустом безымянном слоте.
Обычный img сохраняет исходные размеры и вписывает изображение через object-fit: contain.
Явное пустое alt сохраняется. Отсутствие обоих значений оставляет пустую область.

@property label - Доступное имя области и запасное описание изображения, если его alt не задан.

@example
```tsx
<ContentSurface
  label="Предпросмотр"
  image={{src: "/preview.png", width: 640, height: 480}}
/>
```
*/
export interface ContentSurfaceProps {
  readonly image?: NodePreviewImage | undefined
  readonly label: string
}
