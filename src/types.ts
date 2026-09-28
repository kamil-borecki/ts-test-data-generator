export type DataType = 'number' | 'string' | 'boolean' | 'date'
export type NumberVariant = 'int' | 'float' | 'unixEpoch'
export type StringVariant = 'name' | 'email' | 'uuid' | 'word' | 'sentence' | 'phone' | 'url'
export type BooleanVariant = 'boolean'
export type DateVariant = 'iso' | 'unixEpoch'

export type Field = {
  id: string
  name: string
  type: DataType
  numberVariant?: NumberVariant
  stringVariant?: StringVariant
  booleanVariant?: BooleanVariant
  dateVariant?: DateVariant
  min?: number
  max?: number
  decimals?: number
}

export const numberVariants: { value: NumberVariant; label: string }[] = [
  { value: 'int', label: 'Int' },
  { value: 'float', label: 'Float' },
  { value: 'unixEpoch', label: 'Unix epoch' },
]

export const stringVariants: { value: StringVariant; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'uuid', label: 'UUID' },
  { value: 'word', label: 'Word' },
  { value: 'sentence', label: 'Sentence' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
]

export const dateVariants: { value: DateVariant; label: string }[] = [
  { value: 'iso', label: 'ISO date' },
  { value: 'unixEpoch', label: 'Unix epoch' },
]
