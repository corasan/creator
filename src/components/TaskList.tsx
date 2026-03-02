import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { AgentTask, TaskStatus } from '../types.js'

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'done':
      return <Text color="green">✔</Text>
    case 'running':
      return (
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
      )
    case 'error':
      return <Text color="red">✖</Text>
    case 'skipped':
      return <Text dimColor>⊘</Text>
    default:
      return <Text dimColor>○</Text>
  }
}

function TaskRow({ task }: { task: AgentTask }) {
  const dimmed = task.status === 'pending' || task.status === 'skipped'
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <StatusIcon status={task.status} />
        <Text
          dimColor={dimmed}
          color={
            task.status === 'error'
              ? 'red'
              : task.status === 'running'
                ? 'cyan'
                : undefined
          }
          bold={task.status === 'running'}
        >
          {task.label}
          {task.status === 'running' ? '...' : ''}
        </Text>
      </Box>
      {task.error && (
        <Box marginLeft={3}>
          <Text color="red" dimColor>
            {task.error}
          </Text>
        </Box>
      )}
    </Box>
  )
}

export function TaskList({
  tasks,
  title,
}: {
  tasks: AgentTask[]
  title?: string
}) {
  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={1}>
          <Text bold color="white">
            {title}
          </Text>
        </Box>
      )}
      <Box flexDirection="column" marginLeft={1}>
        {tasks.map(task => (
          <TaskRow key={task.id} task={task} />
        ))}
      </Box>
    </Box>
  )
}
