/**
Произвольное содержимое квадратной области ContentNode.

@packageDocumentation
*/

import type {ContentSurfaceProps} from "./contract/input.ts"
export type {ContentSurfaceProps} from "./contract/input.ts"

/** Показывает авторское содержимое либо изображение в границах предоставленной области. */

export function ContentSurface(props: ContentSurfaceProps) {
  return <section
    aria-label={props.label}
    style={css`
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    `}
  >
    {props.children}
    <img
      hidden={props.children != null || props.image === undefined}
      src={props.children == null ? props.image?.src : undefined}
      width={props.image?.width}
      height={props.image?.height}
      alt={props.image?.alt ?? props.label}
      style={css`
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;

        &[hidden] {
          display: none;
        }
      `}
    />
  </section>
}
