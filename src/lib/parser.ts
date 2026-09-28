import type { Field } from '../types'

const createField = (overrides: Partial<Field> = {}): Field => ({
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

export const parseTypeText = (input: string): Field[] | null => {
  if (!input.trim()) return null

  const sanitized = input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/export\s+/g, '').trim()
  const objectMatch = sanitized.match(/(?:type|interface)\s+[A-Za-z0-9_$]+\s*(?:=\s*)?\{([\s\S]*)\}\s*;?$/)
  const body = objectMatch ? objectMatch[1] : sanitized.replace(/^[A-Za-z0-9_$]+\s*=\s*/, '').trim()

  if (!body || !body.includes(':')) return null

  const entries = body
    .split(/[\n;]+/)
    .flatMap((part) => part.split(','))
    .map((part) => part.trim())
    .filter(Boolean)

  const parsed: Field[] = []

  for (const entry of entries) {
    const propMatch = entry.match(/^([A-Za-z0-9_$]+)\??\s*:\s*([^\s;]+)\s*$/)
    if (!propMatch) continue

    const [, rawName, rawType] = propMatch
    const name = rawName.trim()
    const normalizedType = rawType.trim().replace(/,$/, '')

    if (!name || !normalizedType) continue

    const lowerType = normalizedType.toLowerCase()

    if (lowerType === 'string' || lowerType === 'string[]') {
      parsed.push(
        createField({
          name,
          type: 'string',
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

    if (lowerType === 'number' || lowerType === 'number[]') {
      parsed.push(
        createField({
          name,
          type: 'number',
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
      parsed.push(createField({ name, type: 'boolean', booleanVariant: 'boolean' }))
      continue
    }

    if (normalizedType === 'Date') {
      parsed.push(createField({ name, type: 'date', dateVariant: 'iso' }))
    }
  }

  return parsed.length > 0 ? parsed : null
}
