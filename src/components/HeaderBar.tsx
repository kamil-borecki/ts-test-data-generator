import { Button, Group, Stack, Text, Title } from '@mantine/core'

type HeaderBarProps = {
  onGenerate: () => void
}

export default function HeaderBar({ onGenerate }: HeaderBarProps) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" className="topbar-group">
      <Stack gap={4}>
        <Text fw={700} c="violet.3" tt="uppercase" size="xs" className="eyebrow">
          Test data starter
        </Text>
        <Title order={1}>TypeScript data generator</Title>
      </Stack>

      <Button onClick={onGenerate} size="xs" variant="filled" color="violet">
        Generate data
      </Button>
    </Group>
  )
}
