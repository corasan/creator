import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'

interface Props {
  onSubmit: (prompt: string) => void
}

export function PromptInput({ onSubmit }: Props) {
  const [value, setValue] = useState('')

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>
        Describe your app{' '}
        <Text dimColor>(optional — press enter to skip)</Text>
      </Text>
      <Box gap={1}>
        <Text color="cyan">›</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={onSubmit}
          placeholder="e.g. A fitness tracker with a home screen and workout logger"
        />
      </Box>
    </Box>
  )
}
