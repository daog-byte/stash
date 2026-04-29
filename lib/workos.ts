import { WorkOS } from '@workos-inc/node'

const workosApiKey = process.env.WORKOS_API_KEY

if (!workosApiKey) {
  throw new Error('Missing WORKOS_API_KEY environment variable')
}

export const workos = new WorkOS(workosApiKey)
