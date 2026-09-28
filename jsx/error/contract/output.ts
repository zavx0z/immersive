/** Стандартная Error с идентичностью исходного файла. */
export interface JsxErrorOutput extends Error { readonly sourcePath: string }
