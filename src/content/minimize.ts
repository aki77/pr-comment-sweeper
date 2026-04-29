import type { ReportedContentClassifier } from '../types'

export type MinimizeOutcome =
  | { ok: true }
  | { ok: false; error: string }

export async function minimizeComment(
  commentEl: HTMLElement,
  classifier: ReportedContentClassifier,
): Promise<MinimizeOutcome> {
  const form = commentEl.querySelector<HTMLFormElement>('form.js-timeline-comment-minimize, form[action$="/minimize"]')
  if (!form) return { ok: false, error: 'minimize form not found' }

  const action = form.getAttribute('action')
  const tokenInput = form.querySelector<HTMLInputElement>('input[name="authenticity_token"]')
  if (!action || !tokenInput) return { ok: false, error: 'csrf token missing' }

  const body = new FormData()
  body.set('_method', 'put')
  body.set('authenticity_token', tokenInput.value)
  body.set('classifier', classifier)

  let response: Response
  try {
    response = await fetch(action, {
      method: 'POST',
      body,
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
    })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }

  if (!response.ok) {
    return { ok: false, error: `HTTP ${response.status}` }
  }
  return { ok: true }
}

export function markCommentAsMinimized(commentEl: HTMLElement) {
  commentEl.classList.remove('unminimized-comment')
  commentEl.classList.add('minimized-comment')
  commentEl.style.opacity = '0.5'
}
