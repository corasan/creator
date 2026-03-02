import fs from 'node:fs'
import path from 'node:path'
import type { Framework } from '../types.js'

export interface ScaffoldResult {
  success: boolean
  error?: string
}

export interface ScaffoldArgs {
  args: string[]
  name: string
  parentDir: string
}

// Returns the CLI command + args for a framework, or null for ink-cli (no external CLI)
export function getScaffoldArgs(
  framework: Framework,
  targetPath: string,
): ScaffoldArgs | null {
  const name = path.basename(targetPath)
  const parentDir = path.dirname(path.resolve(targetPath))

  switch (framework) {
    case 'expo':
      return {
        args: ['bunx', 'create-expo-app', name, '--template', 'blank-typescript'],
        name,
        parentDir,
      }
    case 'tanstack-start':
      return {
        args: ['bunx', 'create-tsrouter-app@latest', name, '--template', 'start-basic'],
        name,
        parentDir,
      }
    case 'nextjs':
      return {
        args: ['bunx', 'create-next-app@latest', name, '--typescript', '--tailwind', '--no-git'],
        name,
        parentDir,
      }
    case 'nitro-library':
      return { args: ['bunx', 'create-nitro-lib', name], name, parentDir }
    case 'ink-cli':
      return null
    default:
      return null
  }
}

function runCmd(cmd: string, args: string[], cwd?: string): ScaffoldResult {
  const result = Bun.spawnSync([cmd, ...args], {
    stdout: 'inherit',
    stderr: 'inherit',
    cwd,
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
  if (framework === 'ink-cli') {
    return scaffoldInkCli(targetPath)
  }

  const scaffold = getScaffoldArgs(framework, targetPath)
  if (!scaffold) {
    return { success: false, error: `Unknown framework: ${framework}` }
  }

  const [cmd, ...args] = scaffold.args
  return runCmd(cmd, args, scaffold.parentDir)
}

export function scaffoldInkCli(targetPath: string): ScaffoldResult {
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
