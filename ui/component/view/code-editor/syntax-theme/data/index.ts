/**
Поля синтаксической темы, используемые редактором.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiComponentViewCodeEditorSyntaxThemeData as Contract} from "./contract"
export type {ImmersiveUiComponentViewCodeEditorSyntaxThemeData} from "./contract"

const codeEditorSyntaxTheme = Object.freeze({
  "colors": {
    "editor.background": "#191a1c",
    "editor.foreground": "#bcbec4",
    "editorGutter.background": "#191a1c",
    "editorLineNumber.foreground": "#4b5059",
    "editorIndentGuide.background": "#323438"
  },
  "tokenColors": [
    {
      "scope": [
        "comment",
        "comment.block",
        "comment.line"
      ],
      "settings": {
        "foreground": "#7a7e85"
      }
    },
    {
      "scope": [
        "comment.block.documentation"
      ],
      "settings": {
        "foreground": "#5f826b"
      }
    },
    {
      "scope": [
        "storage.type.class.jsdoc",
        "entity.name.type.instance.jsdoc"
      ],
      "settings": {
        "foreground": "#67a37c"
      }
    },
    {
      "scope": [
        "string",
        "string.quoted",
        "string.template"
      ],
      "settings": {
        "foreground": "#6aab73"
      }
    },
    {
      "scope": [
        "constant.character.escape",
        "constant.other.placeholder"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "constant.numeric",
        "constant.language.numeric"
      ],
      "settings": {
        "foreground": "#2aacb8"
      }
    },
    {
      "scope": [
        "constant.language.boolean"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "constant.language.null",
        "constant.language.undefined"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "keyword",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
        "keyword.other"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "keyword.operator",
        "keyword.operator.arithmetic",
        "keyword.operator.assignment",
        "keyword.operator.comparison",
        "keyword.operator.logical"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "storage.type",
        "storage.modifier"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "entity.name.function",
        "support.function"
      ],
      "settings": {
        "foreground": "#56a8f5"
      }
    },
    {
      "scope": [
        "entity.name.function.member"
      ],
      "settings": {
        "foreground": "#57aaf7"
      }
    },
    {
      "scope": [
        "entity.name.function.member.static"
      ],
      "settings": {
        "foreground": "#57aaf7"
      }
    },
    {
      "scope": [
        "entity.name.type.class",
        "entity.name.class",
        "support.class"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "entity.name.type",
        "support.type"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "entity.name.type.parameter"
      ],
      "settings": {
        "foreground": "#16baac"
      }
    },
    {
      "scope": [
        "entity.name.type.interface"
      ],
      "settings": {
        "foreground": "#16baac"
      }
    },
    {
      "scope": [
        "variable",
        "variable.other.readwrite",
        "variable.other.object"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "variable.other.constant",
        "constant.other"
      ],
      "settings": {
        "foreground": "#c77dbb"
      }
    },
    {
      "scope": [
        "variable.other.property",
        "support.variable.property"
      ],
      "settings": {
        "foreground": "#c77dbb"
      }
    },
    {
      "scope": [
        "variable.other.property.static"
      ],
      "settings": {
        "foreground": "#c77dbb"
      }
    },
    {
      "scope": [
        "variable.parameter"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "variable.language.this",
        "variable.language.super"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "punctuation.separator",
        "punctuation.terminator",
        "punctuation.accessor"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "punctuation.section",
        "meta.brace"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "entity.name.tag"
      ],
      "settings": {
        "foreground": "#d5b778"
      }
    },
    {
      "scope": [
        "entity.other.attribute-name"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "meta.decorator",
        "punctuation.decorator",
        "storage.type.annotation"
      ],
      "settings": {
        "foreground": "#b3ae60"
      }
    },
    {
      "scope": [
        "entity.other.attribute-name.class.css"
      ],
      "settings": {
        "foreground": "#56a8f5"
      }
    },
    {
      "scope": [
        "support.type.property-name.css"
      ],
      "settings": {
        "foreground": "#bcbec4"
      }
    },
    {
      "scope": [
        "keyword.other.important.css"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "support.type.property-name.json"
      ],
      "settings": {
        "foreground": "#c77dbb"
      }
    },
    {
      "scope": [
        "markup.heading",
        "entity.name.section.markdown"
      ],
      "settings": {
        "foreground": "#56a8f5"
      }
    },
    {
      "scope": [
        "markup.inline.raw",
        "markup.fenced_code.block"
      ],
      "settings": {
        "foreground": "#6aab73"
      }
    },
    {
      "scope": [
        "markup.underline.link"
      ],
      "settings": {
        "foreground": "#56a8f5"
      }
    },
    {
      "scope": [
        "string.regexp"
      ],
      "settings": {
        "foreground": "#42c3d4"
      }
    },
    {
      "scope": [
        "entity.name.tag.yaml"
      ],
      "settings": {
        "foreground": "#cf8e6d"
      }
    },
    {
      "scope": [
        "meta.function.decorator.python",
        "entity.name.function.decorator.python"
      ],
      "settings": {
        "foreground": "#b3ae60"
      }
    },
    {
      "scope": [
        "storage.modifier.lifetime.rust",
        "entity.name.type.lifetime.rust"
      ],
      "settings": {
        "foreground": "#32b8af"
      }
    },
    {
      "scope": [
        "markup.inserted"
      ],
      "settings": {
        "foreground": "#6aab73"
      }
    },
    {
      "scope": [
        "markup.deleted",
        "meta.diff.header.from-file",
        "punctuation.definition.deleted"
      ],
      "settings": {
        "foreground": "#ffa198"
      }
    },
    {
      "scope": [
        "invalid.illegal"
      ],
      "settings": {
        "foreground": "#f75464"
      }
    },
    {
      "scope": [
        "keyword.codetag"
      ],
      "settings": {
        "foreground": "#8bb33d"
      }
    }
  ]
}) as Contract.Output

export default codeEditorSyntaxTheme
