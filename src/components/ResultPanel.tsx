import { Button, Code, Group, NumberInput, Paper, SegmentedControl, Select, Title } from '@mantine/core'

type OutputFormat = 'json' | 'typescript'

type ResultPanelProps = {
  recordCount: number
  onRecordCountChange: (value: number) => void
  copied: boolean
  onCopy: () => void
  outputFormat: OutputFormat
  onOutputFormatChange: (value: OutputFormat) => void
  outputText: string
  generationType: string
  generationOptions: string[]
  onGenerationTypeChange: (value: string) => void
}

export default function ResultPanel({
  recordCount,
  onRecordCountChange,
  copied,
  onCopy,
  outputFormat,
  onOutputFormatChange,
  outputText,
  generationType,
  generationOptions,
  onGenerationTypeChange,
}: ResultPanelProps) {
  return (
    <Paper withBorder radius="lg" p="lg">
      <Group justify="space-between" align="flex-end" wrap="nowrap" mb="md" w="100%">
        <Title order={2} size="h3">
          Results
        </Title>

        <Group gap="sm" wrap="nowrap" ml="auto" justify="flex-end" align="flex-end">
          <Select
            size="xs"
            label="Type"
            data={generationOptions.map((name) => ({ value: name, label: name }))}
            value={generationType || generationOptions.at(-1) || ''}
            onChange={(value) => onGenerationTypeChange(value ?? '')}
            placeholder="Select type"
            w={140}
          />

          <NumberInput
            aria-label="Number of records"
            size="xs"
            value={recordCount}
            label="Count"
            min={1}
            max={1000}
            onChange={(value) => onRecordCountChange(Math.max(1, Number(value) || 1))}
            w={88}
          />

          <SegmentedControl
            size="xs"
            value={outputFormat}
            onChange={(value) => onOutputFormatChange(value as OutputFormat)}
            data={[
              { label: 'JSON', value: 'json' },
              { label: 'TypeScript', value: 'typescript' },
            ]}
          />
        </Group>
      </Group>

      <Code block style={{ maxHeight: 420, overflow: 'auto', fontSize: 12, lineHeight: 1.6 }}>
        {outputText}
      </Code>

      <Group justify="flex-end" mt="sm">
        <Button variant="light" color="violet" size="xs" onClick={onCopy}>
          {copied ? 'Copied' : `Copy ${outputFormat === 'json' ? 'JSON' : 'TypeScript'}`}
        </Button>
      </Group>
    </Paper>
  )
}
