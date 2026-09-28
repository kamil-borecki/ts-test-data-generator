import type { DataType, Field } from '../types'

const createField = (overrides: Partial<Field> = {}): Field => ({
  id: crypto.randomUUID(),
  name: 'field',
  type: 'string',
  numberVariant: 'int',
  stringVariant: 'name',
  booleanVariant: 'boolean',
  dateVariant: 'iso',
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
  ...overrides,
})

const parsePropertyList = (
  body: string,
  customTypes: Record<string, Field[]>,
  customEnums: Record<string, string[]>,
): Field[] => {
  const entries = body
    .split(/[\n;]+/)
    .flatMap((part) => part.split(','))
    .map((part) => part.trim())
    .filter(Boolean)

  const parsed: Field[] = []

  for (const entry of entries) {
    const propMatch = entry.match(/^([A-Za-z0-9_$]+)(\?)?\s*:\s*(.+?)\s*$/)
    if (!propMatch) continue

    const [, rawName, optionalMarker, rawType] = propMatch
    const name = rawName.trim()
    const typeExpression = rawType.trim().replace(/,$/, '')

    if (!name || !typeExpression) continue

    const isOptional = Boolean(optionalMarker)
    const normalizedParts = typeExpression
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)

    const nullable = normalizedParts.includes('null')
    const resolvedType = normalizedParts.filter((part) => part !== 'null')[0] ?? typeExpression
    const baseType = resolvedType.replace(/\[]$/, '').trim()
    const isArray = resolvedType.endsWith('[]') || typeExpression.endsWith('[]')

    const buildField = (type: DataType, overrides: Partial<Field> = {}): Field =>
      createField({
        name,
        type,
        optional: isOptional,
        nullable,
        ...overrides,
      })

    const lowerType = baseType.toLowerCase()

    if (customEnums[baseType]) {
      parsed.push(
        buildField('enum', {
          enumName: baseType,
          enumValues: customEnums[baseType],
        }),
      )
      continue
    }

    if (customTypes[baseType]) {
      if (isArray) {
        parsed.push(
          buildField('array', {
            arrayItemType: 'object',
            children: customTypes[baseType],
            min: 2,
            max: 5,
          }),
        )
      } else {
        parsed.push(
          buildField('object', {
            objectType: baseType,
            children: customTypes[baseType],
          }),
        )
      }
      continue
    }

    if (isArray) {
      const arrayItemType = lowerType === 'string' ? 'string' : lowerType === 'number' ? 'number' : lowerType === 'boolean' ? 'boolean' : lowerType === 'date' ? 'date' : 'string'
      parsed.push(buildField('array', { arrayItemType, min: 1, max: 3 }))
      continue
    }

    if (lowerType === 'string') {
      parsed.push(
        buildField('string', {
          stringVariant:
            name.toLowerCase().includes('email')
              ? 'email'
              : name.toLowerCase().includes('name')
                ? 'name'
                : name.toLowerCase().includes('phone')
                  ? 'phone'
                  : 'word',
        }),
      )
      continue
    }

    if (lowerType === 'number') {
      parsed.push(
        buildField('number', {
          numberVariant:
            name.toLowerCase().includes('date') ||
            name.toLowerCase().includes('time') ||
            name.toLowerCase().includes('at') ||
            name.toLowerCase().includes('timestamp')
              ? 'unixEpoch'
              : 'int',
          min: 0,
          max: 100,
        }),
      )
      continue
    }

    if (lowerType === 'boolean') {
      parsed.push(buildField('boolean'))
      continue
    }

    if (lowerType === 'date') {
      parsed.push(buildField('date', { dateVariant: 'iso' }))
      continue
    }

    parsed.push(buildField('string', { stringVariant: 'word' }))
  }

  return parsed
}

export const parseTypeText = (input: string): Field[] | null => {
  if (!input.trim()) return null

  const sanitized = input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/export\s+/g, '')
    .trim()

  const customEnums: Record<string, string[]> = {}
  const customTypes: Record<string, Field[]> = {}

  for (const match of sanitized.matchAll(/enum\s+([A-Za-z0-9_$]+)\s*\{([\s\S]*?)\}/g)) {
    const [, enumName, rawValues] = match
    const values = rawValues
      .split(',')
      .map((value) => value.trim())
      .map((value) => value.replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)

    customEnums[enumName] = values
  }

  for (const match of sanitized.matchAll(/interface\s+([A-Za-z0-9_$]+)\s*\{([\s\S]*?)\}/g)) {
    const [, typeName, body] = match
    customTypes[typeName] = parsePropertyList(body, customTypes, customEnums)
  }

  const objectMatch = sanitized.match(/(?:type|interface)\s+[A-Za-z0-9_$]+\s*(?:=\s*)?\{([\s\S]*)\}\s*;?$/)
  if (objectMatch) {
    const fields = parsePropertyList(objectMatch[1], customTypes, customEnums)
    return fields.length > 0 ? fields : null
  }

  const lastInterface = [...sanitized.matchAll(/interface\s+([A-Za-z0-9_$]+)\s*\{([\s\S]*?)\}/g)].at(-1)
  if (lastInterface) {
    const [, rootName] = lastInterface
    const fields = customTypes[rootName] ?? []
    return fields.length > 0 ? fields : null
  }

  return null
}
