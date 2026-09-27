import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleTravelRequest } from '../../server/httpHandler'

export const config = { maxDuration: 60 }

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleTravelRequest(req, res)
}
