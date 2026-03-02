import type {
  SDKAssistantMessage,
  SDKMessage,
} from '@anthropic-ai/claude-agent-sdk'
import type { AgentTask, AgentEvent, ProjectConfig } from '../types.js'
import { parseAgentLines } from './parseAgentLines.js'

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
      if (
        typeof block === 'object' &&
        block !== null &&
        'type' in block &&
        block.type === 'text' &&
        'text' in block
      ) {
        text += (block as { type: 'text'; text: string }).text
      }
    }
  }
  return text
}

export async function* runAgent(
  config: ProjectConfig,
): AsyncGenerator<AgentEvent> {
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

      const parsed = parseAgentLines(lines, planEmitted)
      for (const event of parsed.events) yield event
      planEmitted = parsed.planEmitted

      if (msg.type === 'result') {
        if (buffer.trim()) {
          const flushed = parseAgentLines(buffer.split('\n'), planEmitted)
          for (const event of flushed.events) yield event
          planEmitted = flushed.planEmitted
          buffer = ''
        }
        yield { type: 'done' }
        return
      }
    }

    if (buffer.trim()) {
      const flushed = parseAgentLines(buffer.split('\n'), planEmitted)
      for (const event of flushed.events) yield event
      planEmitted = flushed.planEmitted
    }
    yield { type: 'done' }
  } catch (e) {
    yield { type: 'error', message: String(e) }
  }
}
