import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type {
  AgentEvent,
  AgentTask,
  ProjectConfig,
  TaskStatus,
} from '../types.js'

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
- Write biome.json with this exact content:
{
    "$schema": "https://biomejs.dev/schemas/2.3.11/schema.json",
    "vcs": { "enabled": false, "clientKind": "git", "useIgnoreFile": false },
    "files": { "ignoreUnknown": false, "includes": ["**", "!.expo", "!node_modules"] },
    "formatter": { "enabled": true, "formatWithErrors": false, "indentStyle": "tab", "indentWidth": 2, "lineEnding": "lf", "lineWidth": 90, "attributePosition": "auto" },
    "linter": { "enabled": true, "rules": { "recommended": true, "correctness": { "useExhaustiveDependencies": "warn" }, "a11y": { "useSemanticElements": "off" } } },
    "javascript": { "formatter": { "enabled": true, "semicolons": "asNeeded", "arrowParentheses": "asNeeded", "bracketSpacing": true, "bracketSameLine": false, "quoteStyle": "single", "attributePosition": "auto", "lineWidth": 80, "trailingCommas": "all", "indentWidth": 2, "indentStyle": "tab" } },
    "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
- Apply app description customizations (update app name, add placeholder screens per prompt)
- Update package.json scripts to: "start": "expo start", "android": "expo run:android", "ios": "expo run:ios", "lint": "biome lint .", "lint:fix": "biome lint --write .", "format": "biome format .", "format:fix": "biome format --write .", "check": "biome check .", "check:fix": "biome check --write .", "typecheck": "tsc --noEmit"
- Run final install
- Do not prebuild or build the iOS or android app
- Do not install pods

Do the actual work — read files, write files, run shell commands. Do not just describe what you would do.

IMPORTANT: Always run shell commands synchronously using the Bash tool directly. Never use background tasks or BashBackground — run all commands inline so they complete before moving on.`
}

function getToolDetail(name: string, input: unknown): string | null {
  if (typeof input !== 'object' || input === null) return null
  const i = input as Record<string, unknown>
  switch (name) {
    case 'Bash':
      return typeof i.command === 'string' ? i.command.slice(0, 80) : null
    case 'Read':
    case 'Write':
    case 'Edit':
      return typeof i.file_path === 'string' ? i.file_path : null
    case 'Glob':
      return typeof i.pattern === 'string' ? i.pattern : null
    case 'Grep':
      return typeof i.pattern === 'string' ? i.pattern : null
    default:
      return null
  }
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
          if (typeof block !== 'object' || block === null || !('type' in block))
            continue

          if (
            block.type === 'tool_use' &&
            'name' in block &&
            'input' in block
          ) {
            const name = (block as { name: string }).name
            const input = (block as { input: unknown }).input

            if (
              name === 'TodoWrite' &&
              typeof input === 'object' &&
              input !== null &&
              'todos' in input
            ) {
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
              const detail = getToolDetail(name, input)
              yield { type: 'activity', text: detail ? `${name}: ${detail}` : name }
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
