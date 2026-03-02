import type { PackageOption } from '../types.js'

// Always installed for Expo (not shown in selection UI)
export const EXPO_ALWAYS_INSTALL = [
  'react-native-mmkv',
  'react-native-unistyles',
  'expo-dev-client',
  'expo-build-properties',
]

// Optional packages shown in multi-select — add new entries here
export const EXPO_PACKAGES: PackageOption[] = [
  {
    label: 'FlashList',
    value: '@shopify/flash-list',
    description: 'Performant list',
  },
  {
    label: 'expo-image',
    value: 'expo-image',
    description: 'Fast image component',
  },
  {
    label: 'react-native-svg',
    value: 'react-native-svg',
    description: 'SVG support',
  },
  {
    label: 'Bottom Sheet',
    value: '@gorhom/bottom-sheet',
    description: 'Bottom sheet modal',
  },
  { label: 'expo-camera', value: 'expo-camera', description: 'Camera access' },
  {
    label: 'expo-notifications',
    value: 'expo-notifications',
    description: 'Push notifications',
  },
  { label: 'expo-blur', value: 'expo-blur', description: 'Blur views' },
  {
    label: 'expo-haptics',
    value: 'expo-haptics',
    description: 'Haptic feedback',
  },
]
