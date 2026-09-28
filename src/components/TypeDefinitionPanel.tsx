import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useState } from 'react'
import type { Field } from '../types'
import FieldEditorCard from './FieldEditorCard'
import { getDeclarationFields, getDeclarationNamesInOrder } from '../lib/parser'

type TypeDefinitionPanelProps = {
  typeText: string
  onTypeTextChange: (value: string) => void
  parseError: string
  fields: Field[]
  enumNames: string[]
  onAddField: (declarationName?: string) => void
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
  enumNames,
  onAddField,
  onApplyPastedType,
  onReset,
  onFieldChange,
  onFieldRemove,
}: TypeDefinitionPanelProps) {
  // Utilities to extract declaration names and order from the textarea
  const extractRootDeclarationName = (text: string): string | null => {
    const blocks = [...text.matchAll(/(?:type|interface)\s+([A-Za-z0-9_$]+)\s*(?:=\s*)?\{[\s\S]*?\}/g)]
    return blocks.at(-1)?.[1] ?? null
  }

  const extractDeclarationNamesInOrder = (text: string): string[] => getDeclarationNamesInOrder(text)

  const rootDeclarationName = extractRootDeclarationName(typeText) ?? 'Root'
  const declaredNames = extractDeclarationNamesInOrder(typeText)
  const otherDeclarations = declaredNames.filter((name) => name !== rootDeclarationName)

  // Build groups per declaration (root + each declared interface), preserving order
  type Group = { title: string; items: Field[] }

  const rootGroup: Group = { title: rootDeclarationName, items: fields }

  const otherGroups: Group[] = otherDeclarations.map((name) => ({
    title: name,
    items: getDeclarationFields(typeText, name),
  }))

  // Collapsible state per group
  const initialCollapseState = Object.fromEntries(
    [rootGroup.title, ...otherGroups.map((g) => g.title)].map((t) => [t, true]),
  ) as Record<string, boolean>
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    initialCollapseState,
  )
  const toggleGroup = (title: string) =>
    setCollapsedGroups((s) => {
      const current = s[title]
      const next = current === undefined ? false : !current
      return { ...s, [title]: next }
    })

  return (
    <Paper withBorder radius="lg" p="lg">
      <Group justify="space-between" align="center" mb="md" w="100%">
        <Title order={2} size="h3">
          Type definition
        </Title>
        <Button variant="light" color="violet" size="xs" onClick={() => onAddField(rootGroup.title)}>
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

        <Group gap="sm">
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

      <Stack gap="lg">
        {/* Root declaration group */}
        <Paper withBorder radius="md" p="sm">
          <Group justify="space-between" align="center" w="100%">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              {rootGroup.title}
            </Text>
            <Group gap="xs">
              <Button variant="light" size="compact-xs" onClick={() => onAddField(rootGroup.title)}>
                + Add field
              </Button>
              <Button variant="subtle" size="compact-xs" onClick={() => toggleGroup(rootGroup.title)}>
                {(collapsedGroups[rootGroup.title] ?? true) ? 'Expand' : 'Collapse'}
              </Button>
            </Group>
          </Group>

          {!((collapsedGroups[rootGroup.title] ?? true)) && (
            <Stack gap="sm" mt="sm" display="flex">
              {rootGroup.items.map((field) => (
                <FieldEditorCard
                  key={field.id}
                  field={field}
                  enumNames={enumNames}
                  interfaceNames={declaredNames}
                  resolveInterfaceChildren={(name) => getDeclarationFields(typeText, name)}
                  typeText={typeText}
                  onTypeTextChange={onTypeTextChange}
                  onFieldChange={onFieldChange}
                  onFieldRemove={onFieldRemove}
                />
              ))}
            </Stack>
          )}
        </Paper>

        {/* Other interface declaration groups in textarea order */}
        {otherGroups.map((group) => (
          <Paper key={group.title} withBorder radius="md" p="sm">
            <Group justify="space-between" align="center" w="100%">
              <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                {group.title}
              </Text>
              <Group gap="xs">
                <Button variant="light" size="compact-xs" onClick={() => onAddField(group.title)}>
                  + Add field
                </Button>
                <Button variant="subtle" size="compact-xs" onClick={() => toggleGroup(group.title)}>
                  {(collapsedGroups[group.title] ?? true) ? 'Expand' : 'Collapse'}
                </Button>
              </Group>
            </Group>

            {!((collapsedGroups[group.title] ?? true)) && (
              <Stack gap="sm" mt="sm">
                {group.items.map((field) => (
                  <FieldEditorCard
                    key={field.id}
                    field={field}
                    enumNames={enumNames}
                    interfaceNames={declaredNames}
                    resolveInterfaceChildren={(name) => getDeclarationFields(typeText, name)}
                    typeText={typeText}
                    onTypeTextChange={onTypeTextChange}
                    onFieldChange={onFieldChange}
                    onFieldRemove={onFieldRemove}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>
    </Paper>
  )
}
