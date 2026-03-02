# Creator CLI — Design Doc
_2026-03-02_

## Overview

An ink CLI app (`create`) that scaffolds new projects by running the standard framework CLI, then using the Claude Agent SDK to customize the project based on selected options and a user prompt. Compiled to a single binary via `bun build --compile` and installed to `/usr/local/bin/create`.

**Usage:**
```
create -p ./my-new-app
create -p ./my-new-app --wizard
```

---

## Architecture

Single root ink component with a screen state machine. A `--wizard` flag splits the options screen into sequential steps; default is a single-screen layout.

**Screen flow:**
```
framework-select → options-select → prompt-input → agent-running → done
```

In `--wizard` mode, `options-select` splits into `backend-select → packages-select`.

**Project structure:**
```
creator/
  src/
    index.tsx              # CLI entry, arg parsing, renders <App />
    app.tsx                # Root component, screen state machine
    screens/
      FrameworkSelect.tsx
      OptionsSelect.tsx    # backend + packages (single-screen mode)
      PromptInput.tsx
      AgentRunner.tsx      # live task list + agent streaming
      Done.tsx
    components/
      TaskList.tsx         # reusable animated checklist
      SelectInput.tsx      # wrapper around ink-select-input
    config/
      packages.ts          # EXPO_PACKAGES: PackageOption[] — extend here
      frameworks.ts        # FRAMEWORKS: FrameworkOption[]
      backends.ts          # BACKENDS: BackendOption[]
    lib/
      agent.ts             # Claude Agent SDK setup (skills + bypass perms)
      scaffolders.ts       # per-framework CLI runners (execa)
    types.ts               # shared ProjectConfig type
  biome.json
  tsconfig.json
  package.json
```

---

## Frameworks

| Framework | CLI used | Biome added |
|-----------|----------|-------------|
| Expo | `create-expo-app` | ✅ |
| TanStack Start | `create-tsrouter-app` | ✅ |
| Next.js | `create-next-app` | ✅ |
| RN Nitro Modules Library | `create-nitro-lib` | ❌ |
| Ink CLI App | custom scaffold | ✅ |

---

## Backend Options (single select, optional)

- Convex
- Supabase
- InstantDB
- Local only (expo-sqlite)
- None

---

## Expo Packages

### Always auto-installed (no selection)
- `react-native-mmkv`
- `react-native-unistyles`
- `expo-dev-client`
- `expo-build-properties`

_(expo-router, react-native-reanimated, react-native-gesture-handler are installed by the expo CLI)_

### Optional multi-select (extensible via `src/config/packages.ts`)
```ts
export const EXPO_PACKAGES: PackageOption[] = [
  { label: 'FlashList', value: '@shopify/flash-list', description: 'Performant list component' },
  { label: 'expo-image', value: 'expo-image' },
  { label: 'react-native-svg', value: 'react-native-svg' },
  { label: 'Bottom Sheet', value: '@gorhom/bottom-sheet' },
  { label: 'expo-camera', value: 'expo-camera' },
  { label: 'expo-notifications', value: 'expo-notifications' },
  { label: 'expo-blur', value: 'expo-blur' },
  { label: 'expo-haptics', value: 'expo-haptics' },
]
```

Adding a new package = one object in this array. No component changes needed.

---

## Agent Runner

**Model:** `claude-sonnet-4-6`
**Permissions:** `bypassPermissions: true`
**Skills:** enabled

### Flow
1. User enters optional prompt describing the app
2. Full `ProjectConfig` (framework, backend, packages, path, prompt) is embedded in the agent system prompt
3. Agent emits a JSON task plan as its first output — ink renders it as a checklist
4. As each task completes, the agent emits a progress marker — ink ticks off the item
5. Agent works inside the target path: installs packages, edits configs, scaffolds components per the prompt

### Task list UI
```
 Creating project
  ✔ Run expo CLI
  ✔ Install core packages (mmkv, unistyles, dev-client, build-properties)
  ◆ Add Convex
  ○ Configure Biome
  ○ Apply prompt customizations
  ○ Install dependencies
```

---

## Done Screen

Shows:
- Target path
- Framework + backend summary
- `cd ./path` hint

---

## Build & Install

```bash
bun run compile    # bun build src/index.tsx --compile --outfile create
bun run install-local  # mv create /usr/local/bin/create
```

---

## Config Extensibility

All selectable options live in `src/config/`. Each file exports a typed array. To add options: edit the array, no component changes needed.

- `frameworks.ts` — add new framework + its CLI command
- `backends.ts` — add new backend option
- `packages.ts` — add new optional expo package
