import type {NodePreviewImage} from "@nodes/node/contracts"

/** Контрастный рисунок показывает вписывание изображения без внешней загрузки. */
export const landscape: NodePreviewImage = {
  src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160"><rect width="320" height="160" fill="#24557a"/><rect x="16" y="16" width="112" height="128" rx="12" fill="#60c5cf"/><circle cx="232" cy="80" r="48" fill="#ffcf6e"/></svg>')}`,
  width: 320,
  height: 160,
  alt: "Прямоугольник и круг",
}

/** Вертикальная композиция отличается от горизонтальной собственными пропорциями. */
export const portrait: NodePreviewImage = {
  src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="320" viewBox="0 0 160 320"><rect width="160" height="320" fill="#24557a"/><rect x="16" y="16" width="128" height="112" rx="12" fill="#60c5cf"/><circle cx="80" cy="232" r="48" fill="#ffcf6e"/></svg>')}`,
  width: 160,
  height: 320,
}
