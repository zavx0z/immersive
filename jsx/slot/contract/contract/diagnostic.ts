/**
Неблокирующее сообщение о компоненте без явной схемы при наличии точек вставки.

@property code - Стабильный идентификатор причины для отчёта сценария.

@property component - Имя объявления получателя, которому принадлежит сообщение.

@property file - Исходник объявления компонента, а не адрес сгенерированного кода.

@property line - Номер строки исходника, начиная с единицы.

@property column - Номер столбца исходника, начиная с единицы.

@property message - Объясняет, какие отношения оставлены без явной проверки типов.
*/
export interface SlotContractDiagnostic {
  readonly code: "JSX-SLOTS-UNTYPED"
  readonly component: string
  readonly file: string
  readonly line: number
  readonly column: number
  readonly message: string
}
