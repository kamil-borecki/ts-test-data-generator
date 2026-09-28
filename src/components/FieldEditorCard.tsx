import {
  Button,
  Checkbox,
  Grid,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useState } from 'react'
import type {
  DataType,
  DateVariant,
  Field,
  NumberVariant,
  StringVariant,
} from '../types'
import { dateVariants, numberVariants, stringVariants } from '../types'

type FieldEditorCardProps = {
  field: Field
  enumNames: string[]
  interfaceNames?: string[]
  resolveInterfaceChildren?: (name: string) => Field[]
  typeText: string
  onTypeTextChange: (value: string) => void
  onFieldChange: (id: string, patch: Partial<Field>) => void
  onFieldRemove: (id: string) => void
}

const createNestedField = (): Field => ({
  id: crypto.randomUUID(),
  name: 'nested_field',
  type: 'string',
  numberVariant: 'int',
  stringVariant: 'name',
  booleanVariant: 'boolean',
  dateVariant: 'iso',
  stringFormat: '',
  dateFormat: '',
  enumValues: ['value'],
  arrayItemType: 'string',
  objectType: 'NestedType',
  nullable: false,
  optional: false,
  children: [],
  min: 0,
  max: 100,
  decimals: 2,
  autoIncrement: false,
  autoIncrementStep: 1,
})

const syncEnumInTypeText = (typeText: string, enumName: string, enumValues: string[]): string => {
  const cleanName = enumName.trim() || 'Enum'
  const values = enumValues.filter(Boolean)
  const block = `enum ${cleanName} {\n  ${values.map((value) => `${value}`).join(',\n  ')}\n}`
  const pattern = new RegExp(`enum\\s+${cleanName}\\s*\\{[\\s\\S]*?\\}`, 'm')

  if (pattern.test(typeText)) {
    return typeText.replace(pattern, block)
  }

  return `${typeText.trim()}\n\n${block}\n`
}

const getEnumValuesFromTypeText = (typeText: string, enumName: string): string[] => {
  const cleanName = enumName.trim()
  if (!cleanName) {
    return []
  }

  const match = typeText.match(new RegExp(`enum\\s+${cleanName}\\s*\\{\\s*([\\s\\S]*?)\\s*\\}`, 'm'))

  return (
    match?.[1]
      ?.split(',')
      .map((item) => item.trim().replace(/['"`]/g, '').replace(/=.*$/, '').trim())
      .filter(Boolean) ?? []
  )
}

export default function FieldEditorCard({
  field,
  enumNames,
  interfaceNames = [],
  resolveInterfaceChildren,
  typeText,
  onTypeTextChange,
  onFieldChange,
  onFieldRemove,
}: FieldEditorCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [newEnumName, setNewEnumName] = useState(field.enumName ?? 'CustomStatus')
  const isObjectLike = field.type === 'object' || (field.type === 'array' && field.arrayItemType === 'object')
  const initialObjectMode: 'inline' | 'reference' =
    isObjectLike && field.objectType && interfaceNames.includes(field.objectType) ? 'reference' : 'inline'
  const [objectMode, setObjectMode] = useState<'inline' | 'reference'>(initialObjectMode)

  // Header labels: show field name and a small tag with its type
  const collapsedLabel = field.name || 'field'
  const getTypeBadge = (): string => {
    if (field.type === 'enum') return field.enumName || 'enum'
    if (field.type === 'object') return field.objectType || 'object'
    if (field.type === 'array') {
      const item = field.arrayItemType || 'string'
      if (item === 'object') return `${field.objectType || 'object'}[]`
      return `${item}[]`
    }
    if (field.type === 'string' && field.stringVariant === 'date') return 'date'
    if (field.type === 'date') return 'date'
    if (field.type === 'boolean') return 'boolean'
    if (field.type === 'number') return 'number'
    return 'string'
  }

  const updateNestedField = (childId: string, patch: Partial<Field>) => {
    if (!field.children) return

    onFieldChange(field.id, {
      children: field.children.map((child) =>
        child.id === childId ? { ...child, ...patch } : child,
      ),
    })
  }

  const removeNestedField = (childId: string) => {
    if (!field.children) return

    onFieldChange(field.id, {
      children: field.children.filter((child) => child.id !== childId),
    })
  }

  const addNestedField = () => {
    onFieldChange(field.id, {
      children: [...(field.children ?? []), createNestedField()],
    })
  }

  const renderNestedFields = () => {
    if (!field.children || field.children.length === 0) {
      return (
        <Stack gap="xs" mt="sm">
          <Text size="xs" c="dimmed">
            No nested fields yet.
          </Text>
          <Button variant="light" size="xs" onClick={addNestedField}>
            + Add nested field
          </Button>
        </Stack>
      )
    }

    return (
      <Stack gap="sm" mt="sm">
        <Group justify="space-between" align="center">
          <Text size="xs" fw={600}>
            Nested fields
          </Text>
          <Button variant="light" size="xs" onClick={addNestedField}>
            + Add nested field
          </Button>
        </Group>

        {field.children.map((child) => (
          <Paper
            key={child.id}
            withBorder
            radius="sm"
            p="sm"
            ml="sm"
            style={{ borderLeft: '2px solid rgba(167, 139, 250, 0.5)' }}
          >
            <FieldEditorCard
              field={child}
              enumNames={enumNames}
              typeText={typeText}
              onTypeTextChange={onTypeTextChange}
              onFieldChange={updateNestedField}
              onFieldRemove={removeNestedField}
            />
          </Paper>
        ))}
      </Stack>
    )
  }

  return (
    <Paper withBorder radius="md" p="sm" style={{ background: 'rgba(15, 23, 42, 0.42)' }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs" w="100%">
        <Group gap={8} align="center">
          <Text fw={700} size="sm">
            {collapsedLabel}
          </Text>
          <Text
            fw={600}
            size="xs"
            c="violet.2"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(167, 139, 250, 0.12)',
              border: '1px solid rgba(167, 139, 250, 0.28)',
            }}
          >
            {getTypeBadge()}
          </Text>
        </Group>

        <Group gap="xs" ml="auto" justify="flex-end">
          <Button variant="subtle" size="compact-xs" onClick={() => setIsCollapsed((value) => !value)}>
            {isCollapsed ? 'Expand' : 'Collapse'}
          </Button>
          <Button color="red" variant="light" size="compact-xs" onClick={() => onFieldRemove(field.id)}>
            Remove
          </Button>
        </Group>
      </Group>

      {!isCollapsed && (
        <>
          <Grid align="end" mt="sm">
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput
                label="Field name"
                value={field.name}
                placeholder="e.g. userId"
                size="xs"
                onChange={(event) => onFieldChange(field.id, { name: event.currentTarget.value })}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 7 }}>
              <Select
                label="Type"
                size="xs"
                data={[
                  { value: 'number', label: 'number' },
                  { value: 'string', label: 'string' },
                  { value: 'boolean', label: 'boolean' },
                  { value: 'enum', label: 'enum' },
                  { value: 'array', label: 'array' },
                  { value: 'object', label: 'object' },
                ]}
                value={field.type}
                onChange={(value) =>
                  onFieldChange(field.id, {
                    type: (value ?? 'string') as DataType,
                    numberVariant: value === 'number' ? 'int' : field.numberVariant,
                    stringVariant: value === 'string' ? 'name' : field.stringVariant,
                    booleanVariant: value === 'boolean' ? 'boolean' : field.booleanVariant,
                    dateVariant: value === 'date' ? 'iso' : field.dateVariant,
                    enumValues: value === 'enum' ? ['new', 'paid', 'shipped'] : field.enumValues,
                    arrayItemType: value === 'array' ? 'string' : field.arrayItemType,
                    objectType: value === 'object' ? 'CustomType' : field.objectType,
                    children: value === 'object' || value === 'array' ? field.children ?? [] : [],
                  })
                }
              />
            </Grid.Col>
          </Grid>

          {field.type === 'number' && (
            <Grid mt="sm">
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <Select
                  label="Variant"
                  size="xs"
                  data={numberVariants.map((item: { value: string; label: string }) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  value={field.numberVariant}
                  onChange={(value) =>
                    onFieldChange(field.id, { numberVariant: (value ?? 'int') as NumberVariant })
                  }
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 3 }}>
                <NumberInput
                  label="Min"
                  size="xs"
                  value={field.min ?? 0}
                  onChange={(value) => onFieldChange(field.id, { min: Number(value) || 0 })}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 3 }}>
                <NumberInput
                  label="Max"
                  size="xs"
                  value={field.max ?? 100}
                  onChange={(value) => onFieldChange(field.id, { max: Number(value) || 100 })}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 3 }}>
                <Checkbox
                  size="xs"
                  label="Auto increment"
                  checked={Boolean(field.autoIncrement)}
                  onChange={(event) =>
                    onFieldChange(field.id, {
                      autoIncrement: event.currentTarget.checked,
                      min: field.min ?? 0,
                    })
                  }
                />
              </Grid.Col>

              {field.numberVariant === 'float' && (
                <Grid.Col span={{ base: 12, sm: 3 }}>
                  <NumberInput
                    label="Decimals"
                    size="xs"
                    min={0}
                    max={6}
                    value={field.decimals ?? 2}
                    onChange={(value) => onFieldChange(field.id, { decimals: Number(value) || 2 })}
                  />
                </Grid.Col>
              )}

              {field.autoIncrement && (
                <>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <NumberInput
                      label="Start"
                      size="xs"
                      value={field.min ?? 0}
                      onChange={(value) => onFieldChange(field.id, { min: Number(value) || 0 })}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 3 }}>
                    <NumberInput
                      label="Step"
                      size="xs"
                      min={1}
                      value={field.autoIncrementStep ?? 1}
                      onChange={(value) => onFieldChange(field.id, { autoIncrementStep: Number(value) || 1 })}
                    />
                  </Grid.Col>
                </>
              )}
            </Grid>
          )}

          {field.type === 'string' && (
            <Grid mt="sm">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Variant"
                  size="xs"
                  data={stringVariants.map((item: { value: string; label: string }) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  value={field.stringVariant ?? 'name'}
                  onChange={(value) =>
                    onFieldChange(field.id, {
                      stringVariant: (value ?? 'name') as StringVariant,
                      dateFormat: value === 'date' ? field.dateFormat || 'yyyy-MM-dd' : field.dateFormat,
                    })
                  }
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={field.stringVariant === 'date' ? 'Date format' : 'Format'}
                  size="xs"
                  placeholder={field.stringVariant === 'date' ? 'yyyy-MM-dd' : '{{person.firstName}} {{person.lastName}}'}
                  value={field.stringVariant === 'date' ? (field.dateFormat ?? 'yyyy-MM-dd') : (field.stringFormat ?? '')}
                  onChange={(event) =>
                    onFieldChange(field.id, {
                      stringFormat: field.stringVariant === 'date' ? undefined : event.currentTarget.value,
                      dateFormat: field.stringVariant === 'date' ? event.currentTarget.value : field.dateFormat,
                    })
                  }
                />
              </Grid.Col>
            </Grid>
          )}

          {field.type === 'date' && (
            <Grid mt="sm">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Variant"
                  size="xs"
                  data={dateVariants.map((item: { value: string; label: string }) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  value={field.dateVariant}
                  onChange={(value) =>
                    onFieldChange(field.id, { dateVariant: (value ?? 'iso') as DateVariant })
                  }
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Date format"
                  size="xs"
                  placeholder="yyyy-MM-dd"
                  value={field.dateFormat ?? ''}
                  onChange={(event) =>
                    onFieldChange(field.id, { dateFormat: event.currentTarget.value })
                  }
                />
              </Grid.Col>
            </Grid>
          )}

          {field.type === 'enum' && (
            <Grid mt="sm">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Enum name"
                  size="xs"
                  searchable
                  data={Array.from(new Set(enumNames)).map((enumName) => ({
                    value: enumName,
                    label: enumName,
                  }))}
                  value={field.enumName ?? ''}
                  onChange={(value) => {
                    if (!value) {
                      return
                    }

                    const nextValues =
                      (typeText.match(new RegExp(`enum\\s+${value}\\s*\\{\\s*([\\s\\S]*?)\\s*\\}`, 'm'))?.[1]
                        ?.split(',')
                        .map((item) => item.trim().replace(/['"`]/g, '').replace(/=.*$/, '').trim())
                        .filter(Boolean) ?? field.enumValues ?? ['new', 'paid'])

                    onFieldChange(field.id, {
                      enumName: value,
                      enumValues: nextValues,
                    })
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <MultiSelect
                  label="Enum values to use"
                  size="xs"
                  searchable
                  clearable
                  data={
                    field.enumName && enumNames.includes(field.enumName)
                      ? getEnumValuesFromTypeText(typeText, field.enumName)
                      : field.enumValues && field.enumValues.length > 0
                        ? field.enumValues
                        : ['new', 'paid', 'shipped']
                  }
                  value={field.enumValues ?? []}
                  placeholder="Select values"
                  onChange={(nextValues: string[]) => {
                    onFieldChange(field.id, {
                      enumValues: nextValues,
                    })

                    const isExistingEnum = Boolean(field.enumName && enumNames.includes(field.enumName))
                    if (!isExistingEnum) {
                      const name = field.enumName || newEnumName || 'CustomStatus'
                      onTypeTextChange(syncEnumInTypeText(typeText, name, nextValues))
                    }
                  }}
                />
              </Grid.Col>

              {(!field.enumName || !enumNames.includes(field.enumName)) && (
                <Grid.Col span={12}>
                  <TextInput
                    label="New enum name"
                    size="xs"
                    value={newEnumName}
                    onChange={(event) => {
                      const value = event.currentTarget.value || 'CustomStatus'
                      setNewEnumName(value)
                      onFieldChange(field.id, { enumName: value })
                    }}
                  />
                </Grid.Col>
              )}
            </Grid>
          )}

          {field.type === 'array' && (
            <Grid mt="sm">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Item type"
                  size="xs"
                  data={[
                    { value: 'string', label: 'string' },
                    { value: 'number', label: 'number' },
                    { value: 'boolean', label: 'boolean' },
                    { value: 'date', label: 'date' },
                    { value: 'enum', label: 'enum' },
                    { value: 'object', label: 'object' },
                  ]}
                  value={field.arrayItemType ?? 'string'}
                  onChange={(value) =>
                    onFieldChange(field.id, {
                      arrayItemType: (value ?? 'string') as DataType,
                    })
                  }
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Items count"
                  size="xs"
                  min={1}
                  max={10}
                  value={field.min ?? 2}
                  onChange={(value) => onFieldChange(field.id, { min: Number(value) || 2, max: Number(value) || 2 })}
                />
              </Grid.Col>
            </Grid>
          )}

          {field.type === 'object' && (
            <Stack gap="sm" mt="sm">
              <Group>
                <Button
                  size="compact-xs"
                  variant={objectMode === 'inline' ? 'filled' : 'light'}
                  onClick={() => {
                    setObjectMode('inline')
                    onFieldChange(field.id, {
                      objectType: 'Custom',
                    })
                  }}
                >
                  Define inline
                </Button>
                <Button
                  size="compact-xs"
                  variant={objectMode === 'reference' ? 'filled' : 'light'}
                  onClick={() => {
                    setObjectMode('reference')
                    const next = field.objectType && interfaceNames.includes(field.objectType)
                      ? field.objectType
                      : interfaceNames[0]
                    if (next) {
                      onFieldChange(field.id, {
                        objectType: next,
                        children: resolveInterfaceChildren ? resolveInterfaceChildren(next) : field.children,
                      })
                    }
                  }}
                >
                  Use declaration
                </Button>
              </Group>

              {objectMode === 'reference' ? (
                <Select
                  label="Reference type"
                  size="xs"
                  data={interfaceNames.map((n) => ({ value: n, label: n }))}
                  value={(field.objectType && interfaceNames.includes(field.objectType) && field.objectType) || interfaceNames[0]}
                  onChange={(value) => {
                    const v = value || interfaceNames[0]
                    if (!v) return
                    onFieldChange(field.id, {
                      objectType: v,
                      children: resolveInterfaceChildren ? resolveInterfaceChildren(v) : field.children,
                    })
                  }}
                />
              ) : (
                <>
                  <TextInput
                    label="Object type"
                    size="xs"
                    value={field.objectType ?? 'CustomType'}
                    onChange={(event) => onFieldChange(field.id, { objectType: event.currentTarget.value || 'CustomType' })}
                  />
                  {renderNestedFields()}
                </>
              )}
            </Stack>
          )}

          {field.type === 'array' && field.arrayItemType === 'object' && (
            <Stack gap="sm" mt="sm">
              <Group>
                <Button
                  size="compact-xs"
                  variant={objectMode === 'inline' ? 'filled' : 'light'}
                  onClick={() => {
                    setObjectMode('inline')
                    onFieldChange(field.id, {
                      objectType: 'Custom',
                    })
                  }}
                >
                  Define inline
                </Button>
                <Button
                  size="compact-xs"
                  variant={objectMode === 'reference' ? 'filled' : 'light'}
                  onClick={() => {
                    setObjectMode('reference')
                    const next = field.objectType && interfaceNames.includes(field.objectType)
                      ? field.objectType
                      : interfaceNames[0]
                    if (next) {
                      onFieldChange(field.id, {
                        objectType: next,
                        children: resolveInterfaceChildren ? resolveInterfaceChildren(next) : field.children,
                      })
                    }
                  }}
                >
                  Use declaration
                </Button>
              </Group>

              {objectMode === 'reference' ? (
                <Select
                  label="Reference type"
                  size="xs"
                  data={interfaceNames.map((n) => ({ value: n, label: n }))}
                  value={(field.objectType && interfaceNames.includes(field.objectType) && field.objectType) || interfaceNames[0]}
                  onChange={(value) => {
                    const v = value || interfaceNames[0]
                    if (!v) return
                    onFieldChange(field.id, {
                      objectType: v,
                      children: resolveInterfaceChildren ? resolveInterfaceChildren(v) : field.children,
                    })
                  }}
                />
              ) : (
                renderNestedFields()
              )}
            </Stack>
          )}
        </>
      )}
    </Paper>
  )
}
