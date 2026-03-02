import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { FRAMEWORKS } from '../config/frameworks.js'
import type { Framework } from '../types.js'

interface Props {
  onSelect: (framework: Framework) => void
}

export function FrameworkSelect({ onSelect }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Which framework?</Text>
      <SelectInput
        items={FRAMEWORKS}
        onSelect={item => onSelect(item.value)}
      />
    </Box>
  )
}
