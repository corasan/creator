import { Box, Text } from 'ink'
import { useState } from 'react'
import type { Backend, Framework } from '../types.js'
import { BackendSelect } from './BackendSelect.js'
import { PackagesSelect } from './PackagesSelect.js'

interface Props {
  framework: Framework
  onComplete: (backend: Backend, packages: string[]) => void
}

type Step = 'backend' | 'packages'

export function OptionsSelect({ framework, onComplete }: Props) {
  const [step, setStep] = useState<Step>('backend')
  const [backend, setBackend] = useState<Backend>('none')

  const handleBackend = (b: Backend) => {
    setBackend(b)
    if (framework === 'expo') {
      setStep('packages')
    } else {
      onComplete(b, [])
    }
  }

  return (
    <Box flexDirection="column" gap={1}>
      {step === 'backend' && (
        <>
          {backend !== 'none' && (
            <Box gap={1}>
              <Text color="green">✔</Text>
              <Text>
                Backend: <Text color="cyan">{backend}</Text>
              </Text>
            </Box>
          )}
          <BackendSelect onSelect={handleBackend} />
        </>
      )}
      {step === 'packages' && (
        <PackagesSelect onSelect={pkgs => onComplete(backend, pkgs)} />
      )}
    </Box>
  )
}
