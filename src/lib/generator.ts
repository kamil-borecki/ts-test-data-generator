import { faker } from '@faker-js/faker'
import type { Field } from '../types'

export const createField = (overrides: Partial<Field> = {}): Field => ({
  id: crypto.randomUUID(),
  name: 'field',
  type: 'string',
  numberVariant: 'int',
  stringVariant: 'name',
  booleanVariant: 'boolean',
  dateVariant: 'iso',
  min: 0,
  max: 100,
  decimals: 2,
  ...overrides,
})

export const getGeneratedValue = (field: Field): string | number | boolean => {
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
      default:
        return faker.lorem.word()
    }
  }

  if (field.type === 'boolean') {
    return faker.datatype.boolean()
  }

  switch (field.dateVariant) {
    case 'unixEpoch':
      return Math.floor(faker.date.recent({ days: 3650 }).getTime() / 1000)
    case 'iso':
    default:
      return faker.date.recent({ days: 3650 }).toISOString()
  }
}

export const generateRows = (fields: Field[], count: number): Record<string, unknown>[] =>
  Array.from({ length: count }, () => {
    const row: Record<string, unknown> = {}

    fields.forEach((field) => {
      const key = field.name.trim() || `field_${Math.random().toString(36).slice(2, 7)}`
      row[key] = getGeneratedValue(field)
    })

    return row
  })
