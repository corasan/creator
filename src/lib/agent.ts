import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { AgentEvent, AgentTask, ProjectConfig, TaskStatus } from '../types.js'

function buildSystemPrompt(config: ProjectConfig): string {
  return `You are a project scaffolder. The framework CLI has already been run and the project exists at: ${config.path}

Your job is to customize and enhance it based on:
- Framework: ${config.framework}
- Backend: ${config.backend}
- Extra packages: ${config.packages.join(', ') || 'none'}
- App description: ${config.prompt || 'none provided'}

Use the TodoWrite tool to track your tasks. Create todos before you start, update them to in_progress as you work, and mark them completed when done.

Work inside the project directory: ${config.path}

Keep tasks small and focused. Typical tasks:
- Install auto-install packages (mmkv, unistyles, dev-client, build-properties for expo)
- Add backend SDK and config files
- Install selected optional packages
- Configure biome.json (for non-nitro projects)
- Apply app description customizations (update app name, add placeholder screens per prompt)
- Run final install

Do the actual work — read files, write files, run shell commands. Do not just describe what you would do.`
}

function mapStatus(status: string): TaskStatus {
  if (status === 'in_progress') return 'running'
  if (status === 'completed') return 'done'
  return 'pending'
}

export async function* runAgent(
  config: ProjectConfig,
): AsyncGenerator<AgentEvent> {
  const { query } = await import('@anthropic-ai/claude-agent-sdk')

  try {
    for await (const message of query({
      prompt: `Scaffold the project at ${config.path}. Use TodoWrite to track all tasks.`,
      options: {
        cwd: config.path,
        permissionMode: 'bypassPermissions',
        systemPrompt: buildSystemPrompt(config),
        pathToClaudeCodeExecutable: Bun.which('claude') ?? 'claude',
      },
    })) {
      const msg = message as SDKMessage

      if (msg.type === 'assistant') {
        const content = msg.message.content
        if (!Array.isArray(content)) continue

        for (const block of content) {
          if (
            typeof block !== 'object' ||
            block === null ||
            !('type' in block)
          )
            continue

          if (block.type === 'tool_use' && 'name' in block && 'input' in block) {
            const name = (block as { name: string }).name
            const input = (block as { input: unknown }).input

            if (name === 'TodoWrite' && typeof input === 'object' && input !== null && 'todos' in input) {
              const raw = (input as { todos: unknown }).todos
              if (!Array.isArray(raw)) continue

              const tasks: AgentTask[] = raw.map((t: unknown, i: number) => {
                const todo = t as Record<string, unknown>
                return {
                  id: String(todo.id ?? i),
                  label: String(todo.content ?? ''),
                  status: mapStatus(String(todo.status ?? 'pending')),
                }
              })
              yield { type: 'plan', tasks }
            } else {
              yield { type: 'activity', text: name }
            }
          }
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
