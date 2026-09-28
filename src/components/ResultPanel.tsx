import { Button, Code, Divider, Group, NumberInput, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core'

type OutputFormat = 'json' | 'typescript'

type ResultPanelProps = {
  recordCount: number
  onRecordCountChange: (value: number) => void
  copied: boolean
  onCopy: () => void
  outputFormat: OutputFormat
  onOutputFormatChange: (value: OutputFormat) => void
  outputText: string
  schemaPreview: string
}

export default function ResultPanel({
  recordCount,
  onRecordCountChange,
  copied,
  onCopy,
  outputFormat,
  onOutputFormatChange,
  outputText,
  schemaPreview,
}: ResultPanelProps) {
  return (
    <Paper withBorder radius="lg" p="lg" className="panel surface-card">
      <Group justify="space-between" align="flex-end" wrap="nowrap" mb="md">
        <Title order={2} size="h3">
          Results
        </Title>

        <Group gap="sm" wrap="nowrap" className="result-toolbar">
          <Text size="xs" fw={500}>
            Count
          </Text>
          <NumberInput
            aria-label="Number of records"
            size="xs"
            value={recordCount}
            min={1}
            max={1000}
            onChange={(value) => onRecordCountChange(Math.max(1, Number(value) || 1))}
            w={100}
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
          <Button variant="light" color="violet" size="xs" onClick={onCopy}>
            {copied ? 'Copied' : `Copy ${outputFormat === 'json' ? 'JSON' : 'TypeScript'}`}
          </Button>
        </Group>
      </Group>

      <Code block className="json-output">
        {outputText}
      </Code>

      <Divider my="lg" />

      <Stack gap="xs">
        <Text fw={600}>TypeScript</Text>
        <Code block className="type-box">
          {schemaPreview}
        </Code>
      </Stack>
    </Paper>
  )
}
