import type { AgentTask, ProjectConfig } from '../types.js'
import type { SDKAssistantMessage, SDKMessage } from '@anthropic-ai/claude-agent-sdk'

export interface AgentUpdate {
  type: 'plan'
  tasks: AgentTask[]
}

export interface AgentProgress {
  type: 'progress'
  taskId: string
  status: 'running' | 'done' | 'error'
  error?: string
}

export interface AgentDone {
  type: 'done'
}

export interface AgentError {
  type: 'error'
  message: string
}

export type AgentEvent = AgentUpdate | AgentProgress | AgentDone | AgentError

function buildSystemPrompt(config: ProjectConfig): string {
  return `You are a project scaffolder. The framework CLI has already been run and the project exists at: ${config.path}

Your job is to customize and enhance it based on:
- Framework: ${config.framework}
- Backend: ${config.backend}
- Extra packages: ${config.packages.join(', ') || 'none'}
- App description: ${config.prompt || 'none provided'}

IMPORTANT PROTOCOL — you MUST follow this exactly:

1. Start by emitting a JSON task plan on its own line:
   PLAN:{"tasks":[{"id":"t1","label":"Install core packages"},{"id":"t2","label":"Configure Biome"},...]}

2. Before starting each task, emit:
   TASK_START:taskId

3. After completing each task, emit:
   TASK_DONE:taskId

4. If a task fails, emit:
   TASK_ERROR:taskId:error message

5. Work inside the project directory: ${config.path}

Keep tasks small and focused. Typical tasks:
- Install auto-install packages (mmkv, unistyles, dev-client, build-properties for expo)
- Add backend SDK and config files
- Install selected optional packages
- Configure biome.json (for non-nitro projects)
- Apply app description customizations (update app name, add placeholder screens per prompt)
- Run final install

Do the actual work — read files, write files, run shell commands. Do not just describe what you would do.`
}

function extractText(msg: SDKAssistantMessage): string {
  let text = ''
  const content = msg.message.content
  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'object' && block !== null && 'type' in block && block.type === 'text' && 'text' in block) {
        text += (block as { type: 'text'; text: string }).text
      }
    }
  }
  return text
}

export async function* runAgent(config: ProjectConfig): AsyncGenerator<AgentEvent> {
  const { query } = await import('@anthropic-ai/claude-agent-sdk')

  let planEmitted = false
  let buffer = ''

  try {
    for await (const message of query({
      prompt: `Scaffold the project at ${config.path}. Follow the PLAN/TASK_START/TASK_DONE protocol exactly.`,
      options: {
        cwd: config.path,
        permissionMode: 'bypassPermissions',
        systemPrompt: buildSystemPrompt(config),
      },
    })) {
      // Accumulate text output from assistant messages
      const msg = message as SDKMessage
      if (msg.type === 'assistant') {
        buffer += extractText(msg)
      }

      // Parse protocol markers from buffer line by line
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()

        if (!planEmitted && trimmed.startsWith('PLAN:')) {
          try {
            const json = JSON.parse(trimmed.slice(5)) as { tasks: Array<{ id: string; label: string }> }
            const tasks: AgentTask[] = json.tasks.map(t => ({
              ...t,
              status: 'pending' as const,
            }))
            yield { type: 'plan', tasks }
            planEmitted = true
          } catch {
            // malformed plan, ignore
          }
        } else if (trimmed.startsWith('TASK_START:')) {
          const taskId = trimmed.slice(11).trim()
          yield { type: 'progress', taskId, status: 'running' }
        } else if (trimmed.startsWith('TASK_DONE:')) {
          const taskId = trimmed.slice(10).trim()
          yield { type: 'progress', taskId, status: 'done' }
        } else if (trimmed.startsWith('TASK_ERROR:')) {
          const rest = trimmed.slice(11)
          const colonIdx = rest.indexOf(':')
          const taskId = colonIdx >= 0 ? rest.slice(0, colonIdx) : rest
          const error = colonIdx >= 0 ? rest.slice(colonIdx + 1) : 'Unknown error'
          yield { type: 'progress', taskId, status: 'error', error }
        }
      }

      if (msg.type === 'result') {
        yield { type: 'done' }
        return
      }
    }

    yield { type: 'done' }
  } catch (e) {
    yield { type: 'error', message: String(e) }
  }
}
