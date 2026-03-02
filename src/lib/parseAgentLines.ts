import type { AgentEvent } from '../types.js'
import type { AgentTask } from '../types.js'

export function parseAgentLines(
  lines: string[],
  planEmitted: boolean,
): { events: AgentEvent[]; planEmitted: boolean } {
  const events: AgentEvent[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!planEmitted && trimmed.startsWith('PLAN:')) {
      try {
        const json = JSON.parse(trimmed.slice(5)) as {
          tasks: Array<{ id: string; label: string }>
        }
        const tasks: AgentTask[] = json.tasks.map(t => ({
          ...t,
          status: 'pending' as const,
        }))
        events.push({ type: 'plan', tasks })
        planEmitted = true
      } catch {
        // malformed plan, ignore
      }
    } else if (trimmed.startsWith('TASK_START:')) {
      events.push({
        type: 'progress',
        taskId: trimmed.slice(11).trim(),
        status: 'running',
      })
    } else if (trimmed.startsWith('TASK_DONE:')) {
      events.push({
        type: 'progress',
        taskId: trimmed.slice(10).trim(),
        status: 'done',
      })
    } else if (trimmed.startsWith('TASK_ERROR:')) {
      const rest = trimmed.slice(11)
      const colonIdx = rest.indexOf(':')
      events.push({
        type: 'progress',
        taskId: colonIdx >= 0 ? rest.slice(0, colonIdx) : rest,
        status: 'error',
        error: colonIdx >= 0 ? rest.slice(colonIdx + 1) : 'Unknown error',
      })
    }
  }

  return { events, planEmitted }
}
