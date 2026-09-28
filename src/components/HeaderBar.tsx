import { Button, Group, Stack, Text, Title } from '@mantine/core'

type HeaderBarProps = {
  onGenerate: () => void
}

export default function HeaderBar({ onGenerate }: HeaderBarProps) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" w="100%">
      <Stack gap={4}>
        <Text fw={700} c="violet.3" tt="uppercase" size="xs" style={{ letterSpacing: '0.12em' }}>
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
