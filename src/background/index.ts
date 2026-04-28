import { minimizeComment } from '../lib/graphql'
import type { MinimizeRequest, MinimizeResponse } from '../lib/messages'
import { getPat } from '../lib/storage'

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: MinimizeResponse) => void) => {
    if (!isMinimizeRequest(message)) return false

    void handleMinimize(message).then(sendResponse)
    return true
  },
)

async function handleMinimize(req: MinimizeRequest): Promise<MinimizeResponse> {
  const pat = await getPat()
  if (!pat) {
    return { ok: false, error: 'PAT_MISSING' }
  }

  try {
    const result = await minimizeComment(pat, req.subjectId, req.classifier)
    return { ok: true, isMinimized: result.isMinimized, minimizedReason: result.minimizedReason }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    return { ok: false, error }
  }
}

function isMinimizeRequest(value: unknown): value is MinimizeRequest {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v['type'] === 'MINIMIZE_COMMENT' &&
    typeof v['subjectId'] === 'string' &&
    typeof v['classifier'] === 'string'
  )
}
