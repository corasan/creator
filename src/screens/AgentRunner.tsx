import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { useEffect, useState } from 'react'
import { TaskList } from '../components/TaskList.js'
import { runAgent } from '../lib/agent.js'
import { scaffoldProject } from '../lib/scaffolders.js'
import type { AgentTask, ProjectConfig } from '../types.js'

interface Props {
  config: ProjectConfig
  onDone: () => void
  onError: (msg: string) => void
}

type Phase = 'scaffolding' | 'agent' | 'done' | 'error'

export function AgentRunner({ config, onDone, onError }: Props) {
  const [phase, setPhase] = useState<Phase>('scaffolding')
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function run() {
      // Phase 1: run framework CLI
      const result = scaffoldProject(config.framework, config.path)
      if (!result.success) {
        setErrorMsg(result.error ?? 'Scaffold failed')
        setPhase('error')
        onError(result.error ?? 'Scaffold failed')
        return
      }

      // Phase 2: stream agent
      setPhase('agent')
      for await (const event of runAgent(config)) {
        if (event.type === 'plan') {
          setTasks(event.tasks)
        } else if (event.type === 'progress') {
          setTasks(prev =>
            prev.map(t =>
              t.id === event.taskId
                ? { ...t, status: event.status, error: event.error }
                : t,
            ),
          )
        } else if (event.type === 'done') {
          setPhase('done')
          onDone()
          return
        } else if (event.type === 'error') {
          setErrorMsg(event.message)
          setPhase('error')
          onError(event.message)
          return
        }
      }
    }

    run()
  }, [config, onDone, onError])

  if (phase === 'scaffolding') {
    return (
      <Box gap={1}>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text>Running {config.framework} CLI...</Text>
      </Box>
    )
  }

  if (phase === 'error') {
    return (
      <Box flexDirection="column" gap={1}>
        <Box gap={1}>
          <Text color="red">✖</Text>
          <Text color="red">Failed: {errorMsg}</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text color="green">✔</Text>
        <Text>Framework scaffolded</Text>
      </Box>
      {tasks.length > 0 && (
        <TaskList
          tasks={tasks}
          title={phase === 'done' ? 'All done!' : 'Customizing project...'}
        />
      )}
      {tasks.length === 0 && phase === 'agent' && (
        <Box gap={1}>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text dimColor>Agent is planning...</Text>
        </Box>
      )}
    </Box>
  )
}
