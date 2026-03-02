import path from 'node:path'
import fs from 'node:fs'
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

  switch (framework) {
    case 'expo':
      return runCmd('bunx', ['create-expo-app', name, '--template', 'blank-typescript'])
    case 'tanstack-start':
      return runCmd('bunx', ['create-tsrouter-app@latest', name, '--template', 'start-basic'])
    case 'nextjs':
      return runCmd('bunx', ['create-next-app@latest', name, '--typescript', '--tailwind', '--no-git'])
    case 'nitro-library':
      return runCmd('bunx', ['create-nitro-lib', name])
    case 'ink-cli':
      return scaffoldInkCli(targetPath)
    default:
      return { success: false, error: `Unknown framework: ${framework}` }
  }
}

function scaffoldInkCli(targetPath: string): ScaffoldResult {
  try {
    fs.mkdirSync(targetPath, { recursive: true })
    Bun.write(
      `${targetPath}/package.json`,
      JSON.stringify(
        {
          name: path.basename(targetPath),
          version: '0.1.0',
          type: 'module',
          scripts: { dev: 'bun run src/index.tsx' },
          dependencies: { ink: '^5.1.0', react: '^18.3.1' },
          devDependencies: { typescript: '^5.7.0' },
        },
        null,
        2,
      ),
    )
    fs.mkdirSync(`${targetPath}/src`, { recursive: true })
    Bun.write(
      `${targetPath}/src/index.tsx`,
      "#!/usr/bin/env bun\nimport { render } from 'ink'\nimport { Text } from 'ink'\nrender(<Text>Hello</Text>)\n",
    )
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
