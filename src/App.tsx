import { useEffect, useMemo, useState } from 'react'
import { Box, Grid } from '@mantine/core'
import HeaderBar from './components/HeaderBar'
import ResultPanel from './components/ResultPanel'
import TypeDefinitionPanel from './components/TypeDefinitionPanel'
import { createField, generateRows } from './lib/generator'
import { getDeclarationFields, getDeclarationNamesInOrder, parseTypeText } from './lib/parser'
import type { Field } from './types'
import './App.css'

type OutputFormat = 'json' | 'typescript'

const typescriptIdentifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/

const formatTypeScriptValue = (value: unknown, indentation = 0): string => {
  const currentIndent = '  '.repeat(indentation)
  const childIndent = '  '.repeat(indentation + 1)

  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'

    const items = value.map((item) => `${childIndent}${formatTypeScriptValue(item, indentation + 1)}`)
    return `[\n${items.join(',\n')}\n${currentIndent}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'

    const properties = entries.map(([key, item]) => {
      const propertyName = typescriptIdentifierPattern.test(key) ? key : JSON.stringify(key)
      return `${childIndent}${propertyName}: ${formatTypeScriptValue(item, indentation + 1)}`
    })

    return `{\n${properties.join(',\n')}\n${currentIndent}}`
  }

  return JSON.stringify(value)
}

const extractEnumNames = (text: string): string[] => {
  const matches = [...text.matchAll(/enum\s+([A-Za-z0-9_$]+)\s*\{/g)]
  return matches.map((match) => match[1]).filter(Boolean)
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getFieldTypeExpression = (field: Partial<Field>): string => {
  const type = field.type ?? 'string'

  if (type === 'number') return 'number'
  if (type === 'string') return field.stringVariant === 'date' ? 'Date' : 'string'
  if (type === 'boolean') return 'boolean'
  if (type === 'enum') return field.enumName ?? 'string'
  if (type === 'array') {
    const itemType = field.arrayItemType === 'object' ? (field.objectType ?? 'Custom') : (field.arrayItemType ?? 'string')
    return `${itemType}[]`
  }
  if (type === 'object') return field.objectType ?? 'Custom'
  if (type === 'date') return 'Date'

  return 'string'
}

const getDeclarationBlockRange = (source: string, declarationName: string) => {
  const declarationPattern = new RegExp(`(?:type|interface)\\s+${escapeRegExp(declarationName)}\\s*(?:=\\s*)?\\{`, 'm')
  const match = declarationPattern.exec(source)

  if (!match) return null

  const openBraceIndex = match.index + match[0].length - 1
  let depth = 1
  let index = openBraceIndex + 1
  let inSingleQuote = false
  let inDoubleQuote = false
  let inTemplate = false

  while (index < source.length && depth > 0) {
    const char = source[index]

    if (char === '\\' && (inSingleQuote || inDoubleQuote || inTemplate)) {
      index += 2
      continue
    }

    if (inSingleQuote) {
      if (char === "'") inSingleQuote = false
      index += 1
      continue
    }

    if (inDoubleQuote) {
      if (char === '"') inDoubleQuote = false
      index += 1
      continue
    }

    if (inTemplate) {
      if (char === '`') inTemplate = false
      index += 1
      continue
    }

    if (char === "'") {
      inSingleQuote = true
      index += 1
      continue
    }

    if (char === '"') {
      inDoubleQuote = true
      index += 1
      continue
    }

    if (char === '`') {
      inTemplate = true
      index += 1
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') depth -= 1

    index += 1
  }

  if (depth !== 0) return null

  return { start: openBraceIndex + 1, end: index - 1 }
}

const addFieldToTypeText = (source: string, declarationName: string, field: Field): string => {
  const blockRange = getDeclarationBlockRange(source, declarationName)

  if (!blockRange) return source

  const { start, end } = blockRange
  const body = source.slice(start, end)
  const property = `  ${field.name}: ${getFieldTypeExpression(field)};`
  const payload = body.trim().length > 0 ? `${body.trimEnd()}\n${property}\n` : `\n${property}\n`

  return `${source.slice(0, start)}${payload}${source.slice(end)}`
}

const syncFieldInTypeText = (source: string, declarationName: string, currentField: Field, patch: Partial<Field>) => {
  const blockRange = getDeclarationBlockRange(source, declarationName)

  if (!blockRange) return source

  const { start, end } = blockRange
  const declarationFields = getDeclarationFields(source, declarationName)
  const nextField = { ...currentField, ...patch }
  const currentName = currentField.name
  const nextName = nextField.name || currentName

  const transformed = declarationFields
    .map((field) => {
      if (field.name === currentName) {
        return { ...field, ...patch, name: nextName }
      }

      return field
    })
    .filter((field) => field.name.trim().length > 0)

  const properties = transformed.map((field) => `  ${field.name}${field.optional ? '?' : ''}: ${getFieldTypeExpression(field)};`)
  const body = properties.join('\n')

  return `${source.slice(0, start)}\n${body}\n${source.slice(end)}`
}

const removeFieldFromTypeText = (source: string, declarationName: string, fieldName: string) => {
  const blockRange = getDeclarationBlockRange(source, declarationName)

  if (!blockRange) return source

  const { start, end } = blockRange
  const declarationFields = getDeclarationFields(source, declarationName)
  const filtered = declarationFields.filter((field) => field.name !== fieldName)
  const properties = filtered.map((field) => `  ${field.name}${field.optional ? '?' : ''}: ${getFieldTypeExpression(field)};`)
  const body = properties.join('\n')

  return `${source.slice(0, start)}\n${body}\n${source.slice(end)}`
}

const initialFields: Field[] = [
  createField({ name: 'id', type: 'string', stringVariant: 'uuid' }),
  createField({ name: 'age', type: 'number', numberVariant: 'int', min: 18, max: 80 }),
  createField({ name: 'price', type: 'number', numberVariant: 'float', min: 10, max: 9999, decimals: 2 }),
  createField({ name: 'createdAt', type: 'number', numberVariant: 'unixEpoch' }),
  createField({ name: 'email', type: 'string', stringVariant: 'email' }),
]

const defaultTypeText = `type User = {
  id: string;
  age: number;
  price: number;
  createdAt: number;
  email: string;
  active: boolean;
}`

function App() {
  const [fields, setFields] = useState<Field[]>(initialFields)
  const [recordCount, setRecordCount] = useState(5)
  const [generatedRows, setGeneratedRows] = useState<Record<string, unknown>[]>(() =>
    generateRows(initialFields, 5),
  )
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json')
  const [copied, setCopied] = useState(false)
  const [typeText, setTypeText] = useState(defaultTypeText)
  const [parseError, setParseError] = useState('')
  const [generationType, setGenerationType] = useState('User')

  const declarationNames = useMemo(() => getDeclarationNamesInOrder(typeText), [typeText])

  const getFieldTypeLabel = (field: Field): string => {
    switch (field.type) {
      case 'number':
        return 'number'
      case 'string':
        return field.stringVariant === 'date' ? 'Date' : 'string'
      case 'boolean':
        return 'boolean'
      case 'date':
        return 'Date'
      case 'enum':
        return field.enumName ?? 'string'
      case 'array':
        return `${field.arrayItemType === 'object' ? (field.objectType ?? 'Record<string, unknown>') : getFieldTypeLabel({ ...field, type: field.arrayItemType ?? 'string' })}[]`
      case 'object':
        return field.objectType ?? 'Record<string, unknown>'
      default:
        return 'string'
    }
  }

  useEffect(() => {
    if (declarationNames.length === 0) return

    if (!declarationNames.includes(generationType)) {
      setGenerationType(declarationNames.at(-1) ?? '')
    }
  }, [declarationNames, generationType])

  const enumNames = useMemo(() => extractEnumNames(typeText), [typeText])

  const outputText = useMemo(() => {
    const rows = JSON.stringify(generatedRows, null, 2)

    return outputFormat === 'json'
      ? rows
      : `const generatedData: Example[] = ${formatTypeScriptValue(generatedRows)};`
  }, [generatedRows, outputFormat])

  const updateField = (id: string, patch: Partial<Field>) => {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    )
  }

  const applyFieldUpdate = (targetDeclarationName: string | undefined, field: Field, patch: Partial<Field>) => {
    if (!targetDeclarationName) return

    const nextTypeText = syncFieldInTypeText(typeText, targetDeclarationName, field, patch)
    setTypeText(nextTypeText)

    setFields((current) => {
      const nextFields = current.map((item) => (item.id === field.id ? { ...item, ...patch } : item))
      setGeneratedRows(generateRows(nextFields, Math.max(1, Number(recordCount) || 1)))
      return nextFields
    })
  }

  const addField = (declarationName?: string) => {
    const nextField = createField({ name: `field_${Date.now().toString().slice(-6)}` })

    const targetDeclaration = declarationName && declarationNames.includes(declarationName)
      ? declarationName
      : generationType || declarationNames.at(-1)

    if (targetDeclaration) {
      const nextTypeText = addFieldToTypeText(typeText, targetDeclaration, nextField)
      setTypeText(nextTypeText)

      const parsed = parseTypeText(nextTypeText, targetDeclaration)
      if (parsed && parsed.length > 0) {
        if (targetDeclaration === generationType || targetDeclaration === declarationNames.at(-1)) {
          setFields(parsed)
          setGeneratedRows(generateRows(parsed, Math.max(1, Number(recordCount) || 1)))
        }
      }
    }

    if (!declarationName || !declarationNames.includes(declarationName)) {
      setFields((current) => [...current, nextField])
    }
  }

  const removeField = (id: string) => {
    setFields((current) => (current.length > 1 ? current.filter((field) => field.id !== id) : current))
  }

  const applyFieldRemoval = (targetDeclarationName: string | undefined, field: Field) => {
    if (!targetDeclarationName) return

    const nextTypeText = removeFieldFromTypeText(typeText, targetDeclarationName, field.name)
    setTypeText(nextTypeText)

    setFields((current) => {
      const nextFields = current.filter((item) => item.id !== field.id)
      setGeneratedRows(generateRows(nextFields, Math.max(1, Number(recordCount) || 1)))
      return nextFields
    })
  }

  const applyPastedType = () => {
    const target = generationType && declarationNames.includes(generationType)
      ? generationType
      : declarationNames.at(-1) ?? undefined

    const parsed = parseTypeText(typeText, target)

    if (!parsed || parsed.length === 0) {
      setParseError('Could not parse the type. Paste e.g. type User = { id: string; age: number; }')
      return
    }

    setFields(parsed)
    setParseError('')
    setGeneratedRows(generateRows(parsed, Math.max(1, Number(recordCount) || 1)))
  }

  const handleGenerate = () => {
    setGeneratedRows(generateRows(fields, Math.max(1, Number(recordCount) || 1)))
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const resetType = () => {
    setTypeText(defaultTypeText)
    setFields(initialFields)
    setGeneratedRows(generateRows(initialFields, Math.max(1, Number(recordCount) || 1)))
    setParseError('')
  }

  return (
    <Box className="app-shell" p="lg">
      <HeaderBar onGenerate={handleGenerate} />

      <Grid align="flex-start">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <TypeDefinitionPanel
            typeText={typeText}
            onTypeTextChange={setTypeText}
            parseError={parseError}
            fields={fields}
            enumNames={enumNames}
            onAddField={addField}
            onApplyPastedType={applyPastedType}
            onReset={resetType}
            onFieldChange={(id, patch) => {
              const currentField = fields.find((field) => field.id === id)
              if (currentField) {
                applyFieldUpdate(generationType || declarationNames.at(-1), currentField, patch)
              }
              updateField(id, patch)
            }}
            onFieldRemove={(id) => {
              const currentField = fields.find((field) => field.id === id)
              if (currentField) {
                applyFieldRemoval(generationType || declarationNames.at(-1), currentField)
              }
              removeField(id)
            }}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <ResultPanel
            recordCount={recordCount}
            onRecordCountChange={setRecordCount}
            copied={copied}
            onCopy={handleCopy}
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            outputText={outputText}
            generationType={generationType}
            generationOptions={declarationNames}
            onGenerationTypeChange={(value) => {
              const nextType = value || declarationNames.at(-1) || ''
              setGenerationType(nextType)

              if (!nextType) return

              const parsed = parseTypeText(typeText, nextType)
              if (!parsed || parsed.length === 0) return

              setFields(parsed)
              setGeneratedRows(generateRows(parsed, Math.max(1, Number(recordCount) || 1)))
            }}
          />
        </Grid.Col>
      </Grid>
    </Box>
  )
}

export default App
