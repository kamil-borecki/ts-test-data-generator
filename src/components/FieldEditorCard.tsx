import {
  Button,
  Grid,
  NumberInput,
  Paper,
  Select,
  TextInput,
} from '@mantine/core'
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
  onFieldChange: (id: string, patch: Partial<Field>) => void
  onFieldRemove: (id: string) => void
}

export default function FieldEditorCard({
  field,
  onFieldChange,
  onFieldRemove,
}: FieldEditorCardProps) {
  return (
    <Paper withBorder radius="md" p="md" className="field-card">
      <Grid align="end">
        <Grid.Col span={{ base: 12, sm: 5 }}>
          <TextInput
            label="Field name"
            value={field.name}
            placeholder="e.g. userId"
            size="xs"
            onChange={(event) => onFieldChange(field.id, { name: event.currentTarget.value })}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Select
            label="Type"
            size="xs"
            data={[
              { value: 'number', label: 'number' },
              { value: 'string', label: 'string' },
              { value: 'boolean', label: 'boolean' },
              { value: 'date', label: 'date' },
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

        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Button fullWidth color="red" variant="light" size="xs" h={32} mt={0} onClick={() => onFieldRemove(field.id)}>
            Remove
          </Button>
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
        </Grid>
      )}

      {field.type === 'string' && (
        <Grid mt="sm">
          <Grid.Col span={12}>
            <Select
              label="Variant"
              size="xs"
              data={stringVariants.map((item: { value: string; label: string }) => ({
                value: item.value,
                label: item.label,
              }))}
              value={field.stringVariant}
              onChange={(value) =>
                onFieldChange(field.id, { stringVariant: (value ?? 'name') as StringVariant })
              }
            />
          </Grid.Col>
        </Grid>
      )}

      {field.type === 'date' && (
        <Grid mt="sm">
          <Grid.Col span={12}>
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
        </Grid>
      )}

      {field.type === 'enum' && (
        <Grid mt="sm">
          <Grid.Col span={12}>
            <TextInput
              label="Enum values"
              size="xs"
              value={field.enumValues?.join(', ') ?? ''}
              placeholder="new, paid, shipped"
              onChange={(event) =>
                onFieldChange(field.id, {
                  enumValues: event.currentTarget.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
            />
          </Grid.Col>
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
              label="Length"
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
        <Grid mt="sm">
          <Grid.Col span={12}>
            <TextInput
              label="Object type"
              size="xs"
              value={field.objectType ?? 'CustomType'}
              onChange={(event) => onFieldChange(field.id, { objectType: event.currentTarget.value || 'CustomType' })}
            />
          </Grid.Col>
        </Grid>
      )}
    </Paper>
  )
}
