import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core'
import type { Field } from '../types'
import FieldEditorCard from './FieldEditorCard'

type TypeDefinitionPanelProps = {
  typeText: string
  onTypeTextChange: (value: string) => void
  parseError: string
  fields: Field[]
  onAddField: () => void
  onApplyPastedType: () => void
  onReset: () => void
  onFieldChange: (id: string, patch: Partial<Field>) => void
  onFieldRemove: (id: string) => void
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const syntaxTokenPattern = /\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:type|interface|enum|export)\b|\b(?:string|number|boolean|Date|unknown|any|null|undefined)\b|[{}();:]/g

const highlightTsCode = (value: string) =>
  escapeHtml(value).replace(syntaxTokenPattern, (token) => {
    let className = 'ts-punctuation'

    if (token.startsWith('//')) className = 'ts-comment'
    else if (/^["'`]/.test(token)) className = 'ts-string'
    else if (/^(type|interface|export)$/.test(token)) className = 'ts-keyword'
    else if (/^(string|number|boolean|Date|unknown|any|null|undefined)$/.test(token)) className = 'ts-type'

    return `<span class="${className}">${token}</span>`
  })

export default function TypeDefinitionPanel({
  typeText,
  onTypeTextChange,
  parseError,
  fields,
  onAddField,
  onApplyPastedType,
  onReset,
  onFieldChange,
  onFieldRemove,
}: TypeDefinitionPanelProps) {
  return (
    <Paper withBorder radius="lg" p="lg" className="panel surface-card">
      <Group justify="space-between" align="center" mb="md">
        <Title order={2} size="h3">
          Type definition
        </Title>
        <Button variant="light" color="violet" size="xs" onClick={onAddField}>
          + Add field
        </Button>
      </Group>

      <Stack gap="md" mb="md">
        <div>
          <Text size="xs" fw={500} mb={6}>
            Paste TypeScript type
          </Text>

          <div className="ts-editor-shell">
            <pre
              aria-hidden="true"
              className="ts-editor-highlight"
              dangerouslySetInnerHTML={{ __html: highlightTsCode(typeText) }}
            />
            <textarea
              className="ts-editor-input"
              value={typeText}
              spellCheck={false}
              onChange={(event) => onTypeTextChange(event.currentTarget.value)}
              placeholder="type User = { id: string; age: number; email: string; }"
            />
          </div>
        </div>

        <Group className="paste-actions" gap="sm">
          <Button onClick={onApplyPastedType} color="violet" size="xs">
            Paste and use type
          </Button>
          <Button variant="default" onClick={onReset} size="xs">
            Reset
          </Button>
        </Group>

        {parseError && (
          <Text c="red" size="sm">
            {parseError}
          </Text>
        )}
      </Stack>

      <Stack gap="md">
        {fields.map((field) => (
          <FieldEditorCard
            key={field.id}
            field={field}
            onFieldChange={onFieldChange}
            onFieldRemove={onFieldRemove}
          />
        ))}
      </Stack>
    </Paper>
  )
}
