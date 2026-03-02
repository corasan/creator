import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'

interface Props {
  onSubmit: (name: string) => void
}

export function ProjectNameInput({ onSubmit }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = (val: string) => {
    const trimmed = val.trim()
    if (trimmed.length > 0) onSubmit(trimmed)
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Project name?</Text>
      <Box gap={1}>
        <Text color="cyan">›</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder="my-app"
        />
      </Box>
    </Box>
  )
}
