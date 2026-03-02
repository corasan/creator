import { Box, Text } from 'ink'

export function Header() {
  return (
    <Box marginBottom={1} flexDirection="column">
      <Text bold color="cyan">
        creator
      </Text>
      <Text dimColor>New project scaffolder</Text>
    </Box>
  )
}
