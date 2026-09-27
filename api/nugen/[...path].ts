import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleNugenRequest } from '../../server/nugen/http'

export const config = { maxDuration: 60 }

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleNugenRequest(req, res)
}
