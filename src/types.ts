export type Framework =
  | 'expo'
  | 'tanstack-start'
  | 'nextjs'
  | 'nitro-library'
  | 'ink-cli'

export type Backend = 'convex' | 'supabase' | 'instantdb' | 'local' | 'none'

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
  parentDir: string  // parent directory (-p flag)
  name: string       // project name (entered in UI)
  path: string       // full path = parentDir + name
  framework: Framework
  backend: Backend
  packages: string[] // selected optional package values
  prompt: string // user's app description (may be empty)
  wizard: boolean // --wizard flag
}

export interface AgentTask {
  id: string
  label: string
  status: TaskStatus
  error?: string
}

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

export interface AgentActivity {
  type: 'activity'
  text: string
}

export type AgentEvent = AgentUpdate | AgentProgress | AgentDone | AgentError | AgentActivity
