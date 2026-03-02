import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import { EXPO_PACKAGES } from '../config/packages.js'

interface Props {
  onSelect: (packages: string[]) => void
}

export function PackagesSelect({ onSelect }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cursor, setCursor] = useState(0)
  const items = EXPO_PACKAGES

  useInput((_, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1))
    if (key.downArrow) setCursor(c => Math.min(items.length, c + 1))
    if (key.return) {
      if (cursor === items.length) {
        onSelect(Array.from(selected))
      } else {
        const pkg = items[cursor].value
        setSelected(prev => {
          const next = new Set(prev)
          if (next.has(pkg)) next.delete(pkg)
          else next.add(pkg)
          return next
        })
      }
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>
        Optional packages{' '}
        <Text dimColor>
          (↑↓ navigate, enter to toggle, select Done when finished)
        </Text>
      </Text>
      <Box flexDirection="column" marginLeft={1}>
        {items.map((pkg, i) => (
          <Box key={pkg.value} gap={1}>
            <Text color={i === cursor ? 'cyan' : undefined} bold={i === cursor}>
              {i === cursor ? '›' : ' '}
            </Text>
            <Text color={selected.has(pkg.value) ? 'green' : undefined}>
              {selected.has(pkg.value) ? '◉' : '○'} {pkg.label}
            </Text>
            {pkg.description && <Text dimColor>— {pkg.description}</Text>}
          </Box>
        ))}
        <Box gap={1}>
          <Text
            color={cursor === items.length ? 'cyan' : undefined}
            bold={cursor === items.length}
          >
            {cursor === items.length ? '›' : ' '}
          </Text>
          <Text color={cursor === items.length ? 'cyan' : undefined} bold>
            Done
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
