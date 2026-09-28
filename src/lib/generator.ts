import { faker } from '@faker-js/faker'
import type { Field } from '../types'

const formatDateValue = (date: Date, format: string): string => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const replacements: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    yy: String(date.getFullYear()).slice(-2),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  }

  let result = format
  Object.entries(replacements).forEach(([token, value]) => {
    result = result.replaceAll(token, value)
  })

  return result
}

export const createField = (overrides: Partial<Field> = {}): Field => ({
  id: crypto.randomUUID(),
  name: 'field',
  type: 'string',
  numberVariant: 'int',
  stringVariant: 'name',
  booleanVariant: 'boolean',
  dateVariant: 'iso',
  stringFormat: '',
  dateFormat: '',
  enumValues: ['new', 'paid', 'shipped', 'delivered'],
  enumName: 'Status',
  arrayItemType: 'string',
  objectType: 'CustomType',
  nullable: false,
  optional: false,
  children: [],
  min: 0,
  max: 100,
  decimals: 2,
  autoIncrement: false,
  autoIncrementStep: 1,
  ...overrides,
})

const generateNestedObject = (fields: Field[]): Record<string, unknown> => {
  const object: Record<string, unknown> = {}

  fields.forEach((field) => {
    const key = field.name.trim() || `field_${Math.random().toString(36).slice(2, 7)}`
    object[key] = getGeneratedValue(field)
  })

  return object
}

type GeneratedScalar = string | number | boolean | Date | null
type GeneratedArrayItem = GeneratedScalar | Record<string, unknown>
type GeneratedValue = GeneratedScalar | Record<string, unknown> | GeneratedArrayItem[]

const getScalarValue = (field: Field): GeneratedScalar => {
  if (field.type === 'number') {
    const min = field.min ?? 0
    const max = field.max ?? 100

    switch (field.numberVariant) {
      case 'int':
        return faker.number.int({ min, max })
      case 'float':
        return faker.number.float({ min, max, fractionDigits: field.decimals ?? 2 })
      case 'unixEpoch':
        return Math.floor(faker.date.recent({ days: 3650 }).getTime() / 1000)
      default:
        return faker.number.int({ min, max })
    }
  }

  if (field.type === 'string') {
    const customFormat = field.stringFormat?.trim()
    if (customFormat) {
      try {
        return faker.helpers.fake(customFormat)
      } catch {
        return customFormat
      }
    }

    switch (field.stringVariant) {
      case 'name':
        return faker.person.fullName()
      case 'email':
        return faker.internet.email()
      case 'uuid':
        return faker.string.uuid()
      case 'word':
        return faker.lorem.word()
      case 'sentence':
        return faker.lorem.sentence()
      case 'phone':
        return faker.phone.number()
      case 'url':
        return faker.internet.url()
      case 'date': {
        const value = faker.date.recent({ days: 3650 })
        return formatDateValue(value, field.dateFormat?.trim() || 'yyyy-MM-dd')
      }
      default:
        return faker.lorem.word()
    }
  }

  if (field.type === 'boolean') {
    return faker.datatype.boolean()
  }

  if (field.type === 'enum') {
    const values = field.enumValues && field.enumValues.length > 0 ? field.enumValues : ['value']
    return values[Math.floor(Math.random() * values.length)]
  }

  if (field.type === 'date') {
    const value = faker.date.recent({ days: 3650 })
    const customFormat = field.dateFormat?.trim()

    if (customFormat) {
      return formatDateValue(value, customFormat)
    }

    switch (field.dateVariant) {
      case 'unixEpoch':
        return Math.floor(value.getTime() / 1000)
      case 'iso':
      default:
        return value.toISOString()
    }
  }

  if (field.type === 'array') {
    return String('') as GeneratedScalar
  }

  if (field.type === 'object') {
    return String('') as GeneratedScalar
  }

  if (field.nullable && Math.random() > 0.8) {
    return null
  }

  return String(faker.lorem.word())
}

export const getGeneratedValue = (field: Field): GeneratedValue => {
  if (field.type === 'array') {
    const itemType = field.arrayItemType ?? 'string'
    const childField = { ...field, type: itemType, name: `${field.name}_item`, children: field.children ?? [] }
    const size = Math.max(2, field.min ?? 2)
    const arrayItems: GeneratedArrayItem[] = Array.from({ length: size }, () => {
      if (itemType === 'object' && childField.children && childField.children.length > 0) {
        return generateNestedObject(childField.children)
      }
      return getScalarValue(childField)
    })
    return arrayItems
  }

  if (field.type === 'object') {
    return generateNestedObject(field.children ?? [])
  }

  return getScalarValue(field)
}

export const generateRows = (fields: Field[], count: number): Record<string, unknown>[] => {
  const counters = new Map<string, number>()

  return Array.from({ length: count }, () => {
    const row: Record<string, unknown> = {}

    fields.forEach((field) => {
      const key = field.name.trim() || `field_${Math.random().toString(36).slice(2, 7)}`

      if (field.type === 'number' && field.autoIncrement) {
        const step = field.autoIncrementStep ?? 1
        const start = field.min ?? 0
        const current = counters.get(field.id) ?? start
        const value = current
        counters.set(field.id, current + step)
        row[key] = value
        return
      }

      row[key] = getGeneratedValue(field)
    })

    return row
  })
}
