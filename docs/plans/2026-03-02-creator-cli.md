# Creator CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an ink CLI app (`create -p ./path`) that runs a framework CLI then uses the Claude Agent SDK to scaffold/customize the project, with a live task-list UI.

**Architecture:** Single ink component tree with a `phase` state machine. Config lives in typed arrays in `src/config/`. The agent streams progress markers that the AgentRunner screen parses into a live checklist.

**Tech Stack:** Bun, TypeScript, ink 5, ink-select-input, ink-spinner, ink-text-input, @anthropic-ai/claude-agent-sdk, Biome

**Reference:** Mirror the structure of `/Users/henry/Projects/releaser` — same stack, same patterns.

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `biome.json`
- Create: `src/index.tsx` (stub)

**Step 1: Create package.json**

```json
{
  "name": "creator",
  "version": "0.1.0",
  "description": "Project scaffolder CLI",
  "type": "module",
  "bin": {
    "create": "./src/index.tsx"
  },
  "scripts": {
    "dev": "bun run src/index.tsx",
    "compile": "bun build src/index.tsx --compile --outfile create",
    "install-local": "bun run compile && mv create /usr/local/bin/create",
    "typecheck": "tsc --noEmit",
    "check": "biome check .",
    "check:fix": "biome check --write ."
  },
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "ink": "^5.1.0",
    "ink-select-input": "^6.0.0",
    "ink-spinner": "^5.0.0",
    "ink-text-input": "^6.0.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.4",
    "@types/bun": "latest",
    "@types/react": "^18.3.12",
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

**Step 3: Copy biome.json from releaser**

```bash
cp /Users/henry/Projects/releaser/biome.json /Users/henry/Projects/creator/biome.json
```

**Step 4: Create stub src/index.tsx**

```tsx
#!/usr/bin/env bun
console.log('creator')
```

**Step 5: Install dependencies**

```bash
cd /Users/henry/Projects/creator && bun install
```

**Step 6: Verify typecheck runs**

```bash
bun run typecheck
```

Expected: no errors (stub has no types yet).

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: project setup"
```

---

## Task 2: Types

**Files:**
- Create: `src/types.ts`

**Step 1: Write types**

```ts
// src/types.ts

export type Framework =
  | 'expo'
  | 'tanstack-start'
  | 'nextjs'
  | 'nitro-library'
  | 'ink-cli'

export type Backend =
  | 'convex'
  | 'supabase'
  | 'instantdb'
  | 'local'
  | 'none'

export type TaskStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped'

export interface PackageOption {
  label: string
  value: string
  description?: string
}

export interface FrameworkOption {
  label: string
  value: Framework
}

export interface BackendOption {
  label: string
  value: Backend
  description?: string
}

export interface ProjectConfig {
  path: string
  framework: Framework
  backend: Backend
  packages: string[]   // selected optional package values
  prompt: string       // user's app description (may be empty)
  wizard: boolean      // --wizard flag
}

export interface AgentTask {
  id: string
  label: string
  status: TaskStatus
  error?: string
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/types.ts && git commit -m "feat: add shared types"
```

---

## Task 3: Config Files

**Files:**
- Create: `src/config/frameworks.ts`
- Create: `src/config/backends.ts`
- Create: `src/config/packages.ts`

**Step 1: Create src/config/frameworks.ts**

```ts
import type { FrameworkOption } from '../types.js'

export const FRAMEWORKS: FrameworkOption[] = [
  { label: 'Expo', value: 'expo' },
  { label: 'TanStack Start', value: 'tanstack-start' },
  { label: 'Next.js', value: 'nextjs' },
  { label: 'RN Nitro Modules Library', value: 'nitro-library' },
  { label: 'Ink CLI App', value: 'ink-cli' },
]
```

**Step 2: Create src/config/backends.ts**

```ts
import type { BackendOption } from '../types.js'

export const BACKENDS: BackendOption[] = [
  { label: 'Convex', value: 'convex', description: 'Real-time backend' },
  { label: 'Supabase', value: 'supabase', description: 'Postgres + auth' },
  { label: 'InstantDB', value: 'instantdb', description: 'Instant sync' },
  { label: 'Local only (expo-sqlite)', value: 'local', description: 'SQLite on device' },
  { label: 'None', value: 'none' },
]
```

**Step 3: Create src/config/packages.ts**

```ts
import type { PackageOption } from '../types.js'

// Always installed for Expo (not shown in selection UI)
export const EXPO_ALWAYS_INSTALL = [
  'react-native-mmkv',
  'react-native-unistyles',
  'expo-dev-client',
  'expo-build-properties',
]

// Optional packages shown in multi-select — add new entries here
export const EXPO_PACKAGES: PackageOption[] = [
  { label: 'FlashList', value: '@shopify/flash-list', description: 'Performant list' },
  { label: 'expo-image', value: 'expo-image', description: 'Fast image component' },
  { label: 'react-native-svg', value: 'react-native-svg', description: 'SVG support' },
  { label: 'Bottom Sheet', value: '@gorhom/bottom-sheet', description: 'Bottom sheet modal' },
  { label: 'expo-camera', value: 'expo-camera', description: 'Camera access' },
  { label: 'expo-notifications', value: 'expo-notifications', description: 'Push notifications' },
  { label: 'expo-blur', value: 'expo-blur', description: 'Blur views' },
  { label: 'expo-haptics', value: 'expo-haptics', description: 'Haptic feedback' },
]
```

**Step 4: Typecheck**

```bash
bun run typecheck
```

**Step 5: Commit**

```bash
git add src/config && git commit -m "feat: add config files"
```

---

## Task 4: Scaffolders

**Files:**
- Create: `src/lib/scaffolders.ts`

The scaffolders run the official framework CLIs via `Bun.spawnSync`. They take the target path and return the command output.

**Step 1: Create src/lib/scaffolders.ts**

```ts
// src/lib/scaffolders.ts
import path from 'node:path'
import type { Framework } from '../types.js'

export interface ScaffoldResult {
  success: boolean
  error?: string
}

function runCmd(cmd: string, args: string[]): ScaffoldResult {
  const result = Bun.spawnSync([cmd, ...args], {
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (result.exitCode !== 0) {
    return { success: false, error: `Exit code ${result.exitCode}` }
  }
  return { success: true }
}

export function scaffoldProject(
  framework: Framework,
  targetPath: string,
): ScaffoldResult {
  const name = path.basename(targetPath)
  const parentDir = path.dirname(path.resolve(targetPath))

  switch (framework) {
    case 'expo':
      return runCmd('bunx', ['create-expo-app', name, '--template', 'blank-typescript'], )
    case 'tanstack-start':
      return runCmd('bunx', ['create-tsrouter-app@latest', name, '--template', 'start-basic'])
    case 'nextjs':
      return runCmd('bunx', ['create-next-app@latest', name, '--typescript', '--tailwind', '--no-git'])
    case 'nitro-library':
      return runCmd('bunx', ['create-nitro-lib', name])
    case 'ink-cli':
      // Minimal scaffold — agent will fill it in
      return scaffoldInkCli(targetPath)
    default:
      return { success: false, error: `Unknown framework: ${framework}` }
  }
}

function scaffoldInkCli(targetPath: string): ScaffoldResult {
  try {
    Bun.mkdirSync(targetPath, { recursive: true })
    Bun.write(`${targetPath}/package.json`, JSON.stringify({
      name: path.basename(targetPath),
      version: '0.1.0',
      type: 'module',
      scripts: { dev: 'bun run src/index.tsx' },
      dependencies: { ink: '^5.1.0', react: '^18.3.1' },
      devDependencies: { typescript: '^5.7.0' },
    }, null, 2))
    Bun.mkdirSync(`${targetPath}/src`, { recursive: true })
    Bun.write(`${targetPath}/src/index.tsx`, '#!/usr/bin/env bun\nimport { render } from \'ink\'\nimport { Text } from \'ink\'\nrender(<Text>Hello</Text>)\n')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/lib/scaffolders.ts && git commit -m "feat: scaffolders for each framework"
```

---

## Task 5: Agent Lib

**Files:**
- Create: `src/lib/agent.ts`

The agent is given the full `ProjectConfig` and told to:
1. Emit a JSON task plan first
2. Emit `[TASK:START:id]` / `[TASK:DONE:id]` markers as it works
3. Work in the target directory

**Step 1: Create src/lib/agent.ts**

```ts
// src/lib/agent.ts
import type { AgentTask, ProjectConfig } from '../types.js'

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
      // Accumulate text output
      if ('type' in message && message.type === 'assistant') {
        const content = (message as any).message?.content
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text') {
              buffer += block.text
            }
          }
        }
      }

      // Parse protocol markers from buffer line by line
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()

        if (!planEmitted && trimmed.startsWith('PLAN:')) {
          try {
            const json = JSON.parse(trimmed.slice(5))
            const tasks: AgentTask[] = json.tasks.map((t: any) => ({
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

      if ('result' in message) {
        yield { type: 'done' }
        return
      }
    }

    yield { type: 'done' }
  } catch (e) {
    yield { type: 'error', message: String(e) }
  }
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/lib/agent.ts && git commit -m "feat: agent lib with protocol parser"
```

---

## Task 6: Shared Components

**Files:**
- Create: `src/components/TaskList.tsx`
- Create: `src/components/Header.tsx`

**Step 1: Create src/components/TaskList.tsx**

Reuse the StepList pattern from releaser almost verbatim, adapted to `AgentTask`:

```tsx
// src/components/TaskList.tsx
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { AgentTask, TaskStatus } from '../types.js'

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'done':    return <Text color="green">✔</Text>
    case 'running': return <Text color="cyan"><Spinner type="dots" /></Text>
    case 'error':   return <Text color="red">✖</Text>
    case 'skipped': return <Text dimColor>⊘</Text>
    default:        return <Text dimColor>○</Text>
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
          color={task.status === 'error' ? 'red' : task.status === 'running' ? 'cyan' : undefined}
          bold={task.status === 'running'}
        >
          {task.label}{task.status === 'running' ? '...' : ''}
        </Text>
      </Box>
      {task.error && (
        <Box marginLeft={3}>
          <Text color="red" dimColor>{task.error}</Text>
        </Box>
      )}
    </Box>
  )
}

export function TaskList({ tasks, title }: { tasks: AgentTask[]; title?: string }) {
  return (
    <Box flexDirection="column">
      {title && (
        <Box marginBottom={1}>
          <Text bold color="white">{title}</Text>
        </Box>
      )}
      <Box flexDirection="column" marginLeft={1}>
        {tasks.map(task => <TaskRow key={task.id} task={task} />)}
      </Box>
    </Box>
  )
}
```

**Step 2: Create src/components/Header.tsx**

```tsx
// src/components/Header.tsx
import { Box, Text } from 'ink'

export function Header() {
  return (
    <Box marginBottom={1} flexDirection="column">
      <Text bold color="cyan">creator</Text>
      <Text dimColor>New project scaffolder</Text>
    </Box>
  )
}
```

**Step 3: Typecheck**

```bash
bun run typecheck
```

**Step 4: Commit**

```bash
git add src/components && git commit -m "feat: TaskList and Header components"
```

---

## Task 7: FrameworkSelect Screen

**Files:**
- Create: `src/screens/FrameworkSelect.tsx`

**Step 1: Create src/screens/FrameworkSelect.tsx**

```tsx
// src/screens/FrameworkSelect.tsx
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { FRAMEWORKS } from '../config/frameworks.js'
import type { Framework } from '../types.js'

interface Props {
  onSelect: (framework: Framework) => void
}

export function FrameworkSelect({ onSelect }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Which framework?</Text>
      <SelectInput
        items={FRAMEWORKS}
        onSelect={(item) => onSelect(item.value)}
      />
    </Box>
  )
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/screens/FrameworkSelect.tsx && git commit -m "feat: FrameworkSelect screen"
```

---

## Task 8: OptionsSelect Screen (single-screen + wizard)

**Files:**
- Create: `src/screens/OptionsSelect.tsx`
- Create: `src/screens/BackendSelect.tsx`
- Create: `src/screens/PackagesSelect.tsx`

**Step 1: Create src/screens/BackendSelect.tsx**

```tsx
// src/screens/BackendSelect.tsx
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { BACKENDS } from '../config/backends.js'
import type { Backend } from '../types.js'

interface Props {
  onSelect: (backend: Backend) => void
}

export function BackendSelect({ onSelect }: Props) {
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Which backend?</Text>
      <SelectInput
        items={BACKENDS.map(b => ({ ...b, key: b.value }))}
        onSelect={(item) => onSelect(item.value)}
      />
    </Box>
  )
}
```

**Step 2: Create src/screens/PackagesSelect.tsx**

Uses ink-select-input with multi-select via spacebar toggle. We track selected items in state and confirm with Enter after a dedicated "Done" item.

```tsx
// src/screens/PackagesSelect.tsx
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
        // "Done" row
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
      <Text bold>Optional packages <Text dimColor>(↑↓ navigate, enter to toggle, select Done when finished)</Text></Text>
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
          <Text color={cursor === items.length ? 'cyan' : undefined} bold={cursor === items.length}>
            {cursor === items.length ? '›' : ' '}
          </Text>
          <Text color={cursor === items.length ? 'cyan' : undefined} bold>Done</Text>
        </Box>
      </Box>
    </Box>
  )
}
```

**Step 3: Create src/screens/OptionsSelect.tsx (single-screen mode)**

In single-screen mode, show backend + packages (if expo) in sequence within one "screen" using a sub-step state:

```tsx
// src/screens/OptionsSelect.tsx
import { Box, Text } from 'ink'
import { useState } from 'react'
import type { Backend, Framework } from '../types.js'
import { BackendSelect } from './BackendSelect.js'
import { PackagesSelect } from './PackagesSelect.js'

interface Props {
  framework: Framework
  onComplete: (backend: Backend, packages: string[]) => void
}

type Step = 'backend' | 'packages'

export function OptionsSelect({ framework, onComplete }: Props) {
  const [step, setStep] = useState<Step>('backend')
  const [backend, setBackend] = useState<Backend>('none')

  const handleBackend = (b: Backend) => {
    setBackend(b)
    if (framework === 'expo') {
      setStep('packages')
    } else {
      onComplete(b, [])
    }
  }

  return (
    <Box flexDirection="column" gap={1}>
      {step === 'backend' && (
        <>
          {backend !== 'none' && (
            <Box gap={1}>
              <Text color="green">✔</Text>
              <Text>Backend: <Text color="cyan">{backend}</Text></Text>
            </Box>
          )}
          <BackendSelect onSelect={handleBackend} />
        </>
      )}
      {step === 'packages' && (
        <PackagesSelect onSelect={(pkgs) => onComplete(backend, pkgs)} />
      )}
    </Box>
  )
}
```

**Step 4: Typecheck**

```bash
bun run typecheck
```

**Step 5: Commit**

```bash
git add src/screens && git commit -m "feat: options selection screens"
```

---

## Task 9: PromptInput Screen

**Files:**
- Create: `src/screens/PromptInput.tsx`

**Step 1: Create src/screens/PromptInput.tsx**

```tsx
// src/screens/PromptInput.tsx
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'

interface Props {
  onSubmit: (prompt: string) => void
}

export function PromptInput({ onSubmit }: Props) {
  const [value, setValue] = useState('')

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Describe your app <Text dimColor>(optional — press enter to skip)</Text></Text>
      <Box gap={1}>
        <Text color="cyan">›</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={onSubmit}
          placeholder="e.g. A fitness tracker with a home screen and workout logger"
        />
      </Box>
    </Box>
  )
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/screens/PromptInput.tsx && git commit -m "feat: PromptInput screen"
```

---

## Task 10: AgentRunner Screen

**Files:**
- Create: `src/screens/AgentRunner.tsx`

This screen:
1. First runs the framework scaffolder (synchronously, shows a spinner)
2. Then streams the agent, rendering the task list as events arrive

**Step 1: Create src/screens/AgentRunner.tsx**

```tsx
// src/screens/AgentRunner.tsx
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
  }, [])

  if (phase === 'scaffolding') {
    return (
      <Box gap={1}>
        <Text color="cyan"><Spinner type="dots" /></Text>
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
          <Text color="cyan"><Spinner type="dots" /></Text>
          <Text dimColor>Agent is planning...</Text>
        </Box>
      )}
    </Box>
  )
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/screens/AgentRunner.tsx && git commit -m "feat: AgentRunner screen"
```

---

## Task 11: Done Screen

**Files:**
- Create: `src/screens/Done.tsx`

**Step 1: Create src/screens/Done.tsx**

```tsx
// src/screens/Done.tsx
import { Box, Text } from 'ink'
import type { ProjectConfig } from '../types.js'

interface Props {
  config: ProjectConfig
}

export function Done({ config }: Props) {
  return (
    <Box flexDirection="column" gap={1} marginTop={1}>
      <Text color="green" bold>✔ Project created!</Text>
      <Box flexDirection="column" marginLeft={2}>
        <Text><Text dimColor>Path:</Text>     <Text color="cyan">{config.path}</Text></Text>
        <Text><Text dimColor>Framework:</Text> <Text color="cyan">{config.framework}</Text></Text>
        {config.backend !== 'none' && (
          <Text><Text dimColor>Backend:</Text>  <Text color="cyan">{config.backend}</Text></Text>
        )}
      </Box>
      <Box marginTop={1} gap={1}>
        <Text dimColor>Next:</Text>
        <Text color="yellow">cd {config.path}</Text>
      </Box>
    </Box>
  )
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/screens/Done.tsx && git commit -m "feat: Done screen"
```

---

## Task 12: App.tsx — State Machine

**Files:**
- Create: `src/app.tsx`

**Step 1: Create src/app.tsx**

```tsx
// src/app.tsx
import { Box, useApp } from 'ink'
import { useCallback, useState } from 'react'
import { Header } from './components/Header.js'
import { AgentRunner } from './screens/AgentRunner.js'
import { Done } from './screens/Done.js'
import { FrameworkSelect } from './screens/FrameworkSelect.js'
import { OptionsSelect } from './screens/OptionsSelect.js'
import { PromptInput } from './screens/PromptInput.js'
import type { Backend, Framework, ProjectConfig } from './types.js'

type Phase =
  | 'framework-select'
  | 'options-select'
  | 'prompt-input'
  | 'agent-running'
  | 'done'
  | 'error'

interface Props {
  path: string
  wizard: boolean
}

export function App({ path, wizard }: Props) {
  const { exit } = useApp()
  const [phase, setPhase] = useState<Phase>('framework-select')
  const [config, setConfig] = useState<Partial<ProjectConfig>>({ path, wizard })
  const [errorMsg, setErrorMsg] = useState('')

  const handleFramework = useCallback((framework: Framework) => {
    setConfig(c => ({ ...c, framework }))
    setPhase('options-select')
  }, [])

  const handleOptions = useCallback((backend: Backend, packages: string[]) => {
    setConfig(c => ({ ...c, backend, packages }))
    setPhase('prompt-input')
  }, [])

  const handlePrompt = useCallback((prompt: string) => {
    setConfig(c => ({ ...c, prompt }))
    setPhase('agent-running')
  }, [])

  const handleDone = useCallback(() => {
    setPhase('done')
    setTimeout(() => exit(), 500)
  }, [exit])

  const handleError = useCallback((msg: string) => {
    setErrorMsg(msg)
    setPhase('error')
    setTimeout(() => exit(), 2000)
  }, [exit])

  const fullConfig = config as ProjectConfig

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header />

      {phase === 'framework-select' && (
        <FrameworkSelect onSelect={handleFramework} />
      )}
      {phase === 'options-select' && config.framework && (
        <OptionsSelect
          framework={config.framework}
          onComplete={handleOptions}
        />
      )}
      {phase === 'prompt-input' && (
        <PromptInput onSubmit={handlePrompt} />
      )}
      {phase === 'agent-running' && (
        <AgentRunner
          config={fullConfig}
          onDone={handleDone}
          onError={handleError}
        />
      )}
      {phase === 'done' && <Done config={fullConfig} />}
      {phase === 'error' && (
        <Box gap={1}>
          <Box color="red">✖</Box>
          <Box color="red">{errorMsg}</Box>
        </Box>
      )}
    </Box>
  )
}
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Commit**

```bash
git add src/app.tsx && git commit -m "feat: App state machine"
```

---

## Task 13: Entry Point

**Files:**
- Modify: `src/index.tsx`

**Step 1: Write src/index.tsx**

```tsx
#!/usr/bin/env bun
import { render } from 'ink'
import { App } from './app.js'

const args = process.argv.slice(2)

function getFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : undefined
}

const targetPath = getFlag('-p')
const wizard = args.includes('--wizard')

if (!targetPath) {
  console.error('Usage: create -p <path> [--wizard]')
  process.exit(1)
}

render(<App path={targetPath} wizard={wizard} />)
```

**Step 2: Typecheck**

```bash
bun run typecheck
```

**Step 3: Smoke test**

```bash
bun run dev -- -p /tmp/test-creator-app
```

Expected: Header renders, FrameworkSelect appears.

**Step 4: Commit**

```bash
git add src/index.tsx && git commit -m "feat: entry point with -p flag"
```

---

## Task 14: Build & Install

**Step 1: Compile to binary**

```bash
cd /Users/henry/Projects/creator && bun run compile
```

Expected: `create` binary created in project root.

**Step 2: Test the binary**

```bash
./create -p /tmp/test-creator
```

Expected: same as `bun run dev`.

**Step 3: Install to path**

```bash
bun run install-local
```

Expected: `create` available globally.

**Step 4: Verify**

```bash
which create && create -p /tmp/final-test
```

**Step 5: Final commit**

```bash
git add -A && git commit -m "feat: compile and install scripts"
```
