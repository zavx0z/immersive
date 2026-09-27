import {ContentSurface, type ContentSurfaceProps} from "@nodes/node/surface"

/** Область получает содержимое и изображение из выбранного варианта. */
export function SurfaceFixture(props: ContentSurfaceProps) {
  return <ContentSurface
    label={props.label}
    image={props.image}
  >
    {props.children}
  </ContentSurface>
}
