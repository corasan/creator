import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { getScaffoldArgs, scaffoldInkCli } from '../lib/scaffolders.js'

describe('getScaffoldArgs', () => {
  it('resolves relative path correctly', () => {
    const result = getScaffoldArgs('expo', './my-app')
    expect(result).not.toBeNull()
    expect(result!.name).toBe('my-app')
    expect(path.isAbsolute(result!.parentDir)).toBe(true)
    expect(result!.parentDir).toBe(path.dirname(path.resolve('./my-app')))
  })

  it('resolves absolute path correctly', () => {
    const result = getScaffoldArgs('expo', '/tmp/my-app')
    expect(result!.name).toBe('my-app')
    expect(result!.parentDir).toBe('/tmp')
  })

  it('returns correct args for expo', () => {
    const result = getScaffoldArgs('expo', './my-app')
    expect(result!.args).toEqual([
      'bunx',
      'create-expo-app',
      'my-app',
      '--template',
      'blank-typescript',
    ])
  })

  it('returns correct args for nextjs', () => {
    const result = getScaffoldArgs('nextjs', './my-app')
    expect(result!.args).toEqual([
      'bunx',
      'create-next-app@latest',
      'my-app',
      '--typescript',
      '--tailwind',
      '--no-git',
    ])
  })

  it('returns correct args for tanstack-start', () => {
    const result = getScaffoldArgs('tanstack-start', './my-app')
    expect(result!.args[1]).toBe('create-tsrouter-app@latest')
  })

  it('returns correct args for nitro-library', () => {
    const result = getScaffoldArgs('nitro-library', './my-app')
    expect(result!.args[1]).toBe('create-nitro-lib')
  })

  it('returns null for ink-cli (no external CLI)', () => {
    const result = getScaffoldArgs('ink-cli', './my-app')
    expect(result).toBeNull()
  })
})

describe('scaffoldInkCli', () => {
  const tmpDir = `/tmp/creator-test-${Date.now()}`

  afterEach(() => {
    try {
      Bun.spawnSync(['rm', '-rf', tmpDir])
    } catch {
      // ignore cleanup errors
    }
  })

  it('creates package.json with correct name', async () => {
    const result = scaffoldInkCli(tmpDir)
    expect(result.success).toBe(true)
    const pkg = JSON.parse(await Bun.file(`${tmpDir}/package.json`).text())
    expect(pkg.name).toBe(tmpDir.split('/').pop())
    expect(pkg.dependencies.ink).toBeDefined()
  })

  it('creates src/index.tsx', async () => {
    scaffoldInkCli(tmpDir)
    const content = await Bun.file(`${tmpDir}/src/index.tsx`).text()
    expect(content).toContain('render')
  })

  it('succeeds when directory already exists', () => {
    scaffoldInkCli(tmpDir)
    const result = scaffoldInkCli(tmpDir)
    expect(result.success).toBe(true)
  })
})
