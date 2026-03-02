import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { BACKENDS } from '../config/backends.js'
import type { Backend } from '../types.js'

interface Props {
  onSelect: (backend: Backend) => void
}

export function BackendSelect({ onSelect }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Which backend?</Text>
      <SelectInput
        items={BACKENDS.map(b => ({ ...b, key: b.value }))}
        onSelect={item => onSelect(item.value)}
      />
    </Box>
  )
}
