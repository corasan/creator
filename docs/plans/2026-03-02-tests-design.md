# Tests Design Doc
_2026-03-02_

## Overview

Add `bun test` unit tests focused on regression prevention for the two pure-logic modules: the agent protocol parser and the scaffolder path computation.

## Scope

**In scope:**
- Agent line parser (extracted pure function)
- Scaffolder path/args computation (extracted pure function)
- `scaffoldInkCli` file creation (uses temp dir)

**Out of scope:**
- Ink components
- Claude SDK integration (`runAgent`)
- Config array snapshots

## Refactors Required

### 1. Extract `parseAgentLines` from `agent.ts`

New file: `src/lib/parseAgentLines.ts`

```ts
export function parseAgentLines(
  lines: string[],
  planEmitted: boolean,
): { events: AgentEvent[]; planEmitted: boolean }
```

`agent.ts` calls this internally. No behavior change.

### 2. Extract `getScaffoldArgs` from `scaffolders.ts`

New exported function in `scaffolders.ts`:

```ts
export function getScaffoldArgs(
  framework: Framework,
  targetPath: string,
): { name: string; parentDir: string; args: string[] } | null
```

Returns the CLI args and resolved paths for a given framework+path. Returns `null` for `ink-cli` (which has no external CLI). Testable without spawning processes.

## Test Files

### `src/tests/parseAgentLines.test.ts`

Cases:
- `PLAN:` emits plan event + sets planEmitted
- Second `PLAN:` is ignored (planEmitted guard)
- `TASK_START:t1` → progress/running
- `TASK_DONE:t1` → progress/done
- `TASK_ERROR:t1:msg` → progress/error with message
- `TASK_ERROR:t1` (no colon after id) → progress/error with "Unknown error"
- Malformed `PLAN:` JSON → no event
- Empty/blank lines → no events
- Multiple markers in one batch all emit in order

### `src/tests/scaffolders.test.ts`

Cases:
- Relative path `./my-app` → correct basename and absolute parentDir
- Absolute path `/tmp/my-app` → correct basename and parentDir
- Each framework maps to correct CLI args
- `scaffoldInkCli` creates `package.json` and `src/index.tsx` in a temp dir
- `scaffoldInkCli` on existing dir succeeds (recursive mkdir)

## Test Script

Add to `package.json`: `"test": "bun test"`
