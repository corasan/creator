import { Box, Text } from 'ink'
import type { ProjectConfig } from '../types.js'

interface Props {
  config: ProjectConfig
}

export function Done({ config }: Props) {
  return (
    <Box flexDirection="column" gap={1} marginTop={1}>
      <Text color="green" bold>
        ✔ Project created!
      </Text>
      <Box flexDirection="column" marginLeft={2}>
        <Text>
          <Text dimColor>Name: </Text>
          <Text color="cyan">{config.name}</Text>
        </Text>
        <Text>
          <Text dimColor>Path: </Text>
          <Text color="cyan">{config.path}</Text>
        </Text>
        <Text>
          <Text dimColor>Framework: </Text>
          <Text color="cyan">{config.framework}</Text>
        </Text>
        {config.backend !== 'none' && (
          <Text>
            <Text dimColor>Backend: </Text>
            <Text color="cyan">{config.backend}</Text>
          </Text>
        )}
      </Box>
      <Box marginTop={1} gap={1}>
        <Text dimColor>Next:</Text>
        <Text color="yellow">cd {config.path}</Text>
      </Box>
    </Box>
  )
}
