#!/usr/bin/env bun
import { render } from 'ink'
import { App } from './app.js'

const args = process.argv.slice(2)

function getFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : undefined
}

const parentDir = getFlag('-p')
const wizard = args.includes('--wizard')

if (!parentDir) {
  console.error('Usage: create -p <parent-dir> [--wizard]')
  console.error('Example: create -p ~/Projects')
  process.exit(1)
}

render(<App parentDir={parentDir} wizard={wizard} />)
