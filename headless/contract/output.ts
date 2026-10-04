import type {Element} from "@zavx0z/immersive-dom"
import type {ComponentValue} from "@zavx0z/immersive-component"
import type {CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {CapturedFrame} from "../native-canvas.ts"

/**
Результат {@link createHeadless}: один живой host с явным освобождением ресурсов.

Все GPU-операции host сериализуются. Методы принимают только элементы его
собственного `Document`; после `dispose` новые операции завершаются ошибкой.

@property render - Монтирует скомпилированный JSX и возвращает единственный внешний Element.
Рабочая область имеет размеры Canvas. Отрисовка ожидает загрузку текстур;
ошибка загрузки отклоняет операцию, не выдавая прозрачную заглушку за готовый кадр.

@property renderComponent - Программно монтирует компонент с отдельно переданными props.
Сценарий компонента использует render с JSX непосредственно в месте вызова.

@property screenshot - Возвращает PNG по актуальному border-box элемента.
Без второго аргумента результатом служит `Buffer`; формат `image` возвращает `Bun.Image` того же снимка.

@property capture - Возвращает RGBA8 и PNG одного кадра по границам элемента.
Перед снимком применяет изменения компонента и ожидает ресурсы нового кадра.

@property dispose - Освобождает component root, layout, GPU-поверхность и устройство; повторный вызов безопасен.

@example
```tsx
import Typography from "@zavx0z/immersive-ui-component-typography"

const headless = createHeadless()
const element = await headless.render(
  <Typography
    text="Пример"
  />,
)
await headless.dispose()
```
*/
export interface Headless {
  render(value: JSX.Element | ComponentValue): Promise<Element>
  renderComponent<Props>(type: ((props: Props) => JSX.Element) | CompiledTemplate<Props>, props: Props): Promise<Element>
  screenshot(element: Element): Promise<Buffer>
  screenshot(element: Element, format: "image"): Promise<Bun.Image>
  capture(element: Element): Promise<CapturedFrame>
  dispose(): Promise<void>
}
