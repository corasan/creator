import type { BackendOption } from '../types.js'

export const BACKENDS: BackendOption[] = [
  { label: 'Convex', value: 'convex', description: 'Real-time backend' },
  { label: 'Supabase', value: 'supabase', description: 'Postgres + auth' },
  { label: 'InstantDB', value: 'instantdb', description: 'Instant sync' },
  {
    label: 'Local only (expo-sqlite)',
    value: 'local',
    description: 'SQLite on device',
  },
  { label: 'None', value: 'none' },
]
