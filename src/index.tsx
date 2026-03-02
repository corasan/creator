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
