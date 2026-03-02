import path from 'node:path'
import { Box, Text, useApp } from 'ink'
import { useCallback, useState } from 'react'
import { Header } from './components/Header.js'
import { AgentRunner } from './screens/AgentRunner.js'
import { Done } from './screens/Done.js'
import { FrameworkSelect } from './screens/FrameworkSelect.js'
import { OptionsSelect } from './screens/OptionsSelect.js'
import { ProjectNameInput } from './screens/ProjectNameInput.js'
import { PromptInput } from './screens/PromptInput.js'
import type { Backend, Framework, ProjectConfig } from './types.js'

type Phase =
  | 'project-name'
  | 'framework-select'
  | 'options-select'
  | 'prompt-input'
  | 'agent-running'
  | 'done'
  | 'error'

interface Props {
  parentDir: string
  wizard: boolean
}

export function App({ parentDir, wizard }: Props) {
  const { exit } = useApp()
  const [phase, setPhase] = useState<Phase>('project-name')
  const [config, setConfig] = useState<Partial<ProjectConfig>>({
    parentDir,
    wizard,
  })
  const [errorMsg, setErrorMsg] = useState('')

  const handleName = useCallback(
    (name: string) => {
      setConfig(c => ({
        ...c,
        name,
        path: path.join(path.resolve(parentDir), name),
      }))
      setPhase('framework-select')
    },
    [parentDir],
  )

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

  const handleError = useCallback(
    (msg: string) => {
      setErrorMsg(msg)
      setPhase('error')
      setTimeout(() => exit(), 2000)
    },
    [exit],
  )

  const fullConfig = config as ProjectConfig

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header />

      {phase === 'project-name' && <ProjectNameInput onSubmit={handleName} />}
      {phase === 'framework-select' && (
        <FrameworkSelect onSelect={handleFramework} />
      )}
      {phase === 'options-select' && config.framework && (
        <OptionsSelect
          framework={config.framework}
          onComplete={handleOptions}
        />
      )}
      {phase === 'prompt-input' && <PromptInput onSubmit={handlePrompt} />}
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
          <Text color="red">✖</Text>
          <Text color="red">{errorMsg}</Text>
        </Box>
      )}
    </Box>
  )
}
