import { useMemo, useState } from 'react'
import { Box, Grid } from '@mantine/core'
import HeaderBar from './components/HeaderBar'
import ResultPanel from './components/ResultPanel'
import TypeDefinitionPanel from './components/TypeDefinitionPanel'
import { createField, generateRows } from './lib/generator'
import { parseTypeText } from './lib/parser'
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

  const getFieldTypeLabel = (field: Field): string => {
    switch (field.type) {
      case 'number':
        return 'number'
      case 'string':
        return 'string'
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

  const schemaPreview = useMemo(
    () =>
      `type Example = {\n${fields
        .filter((field) => field.name.trim())
        .map((field) => `  ${field.name}${field.optional ? '?' : ''}: ${getFieldTypeLabel(field)};`)
        .join('\n')}\n}`,
    [fields],
  )

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

  const addField = () => {
    setFields((current) => [...current, createField({ name: `field_${current.length + 1}` })])
  }

  const removeField = (id: string) => {
    setFields((current) => (current.length > 1 ? current.filter((field) => field.id !== id) : current))
  }

  const applyPastedType = () => {
    const parsed = parseTypeText(typeText)

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
            onAddField={addField}
            onApplyPastedType={applyPastedType}
            onReset={resetType}
            onFieldChange={updateField}
            onFieldRemove={removeField}
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
            schemaPreview={schemaPreview}
          />
        </Grid.Col>
      </Grid>
    </Box>
  )
}

export default App
