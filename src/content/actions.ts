import type { ReportedContentClassifier } from '../types'

export type Action = 'hide' | 'delete'

export type ActionRequest =
  | { action: 'hide'; classifier: ReportedContentClassifier }
  | { action: 'delete' }

export type ActionOutcome =
  | { ok: true }
  | { ok: false; error: string }

export const ACTION_LABELS: Record<Action, { verb: string; verbDone: string }> = {
  hide: { verb: 'Hide', verbDone: 'hidden' },
  delete: { verb: 'Delete', verbDone: 'deleted' },
}

export async function performAction(
  commentEl: HTMLElement,
  request: ActionRequest,
): Promise<ActionOutcome> {
  if (request.action === 'hide') return doHide(commentEl, request.classifier)
  return doDelete(commentEl)
}

async function doHide(
  commentEl: HTMLElement,
  classifier: ReportedContentClassifier,
): Promise<ActionOutcome> {
  const form = commentEl.querySelector<HTMLFormElement>('form.js-timeline-comment-minimize')
  if (!form) return { ok: false, error: 'minimize form not found' }

  const creds = extractFormCredentials(form)
  if (!creds) return { ok: false, error: 'csrf token missing' }

  const body = new FormData()
  body.set('_method', 'put')
  body.set('authenticity_token', creds.token)
  body.set('classifier', classifier)

  return submitForm(creds.action, body)
}

async function doDelete(commentEl: HTMLElement): Promise<ActionOutcome> {
  const fragmentUrl = commentEl.querySelector('details-menu[src]')?.getAttribute('src')
  if (!fragmentUrl) return { ok: false, error: 'actions menu not found' }

  let fragmentHtml: string
  try {
    const resp = await fetch(fragmentUrl, {
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
    })
    if (!resp.ok) return { ok: false, error: `actions HTTP ${resp.status}` }
    fragmentHtml = await resp.text()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }

  const doc = new DOMParser().parseFromString(fragmentHtml, 'text/html')
  const deleteForm = doc.querySelector<HTMLFormElement>('form.js-comment-delete')
  if (!deleteForm) return { ok: false, error: 'delete not permitted' }

  const creds = extractFormCredentials(deleteForm)
  if (!creds) return { ok: false, error: 'csrf token missing' }

  const inputId = deleteForm.querySelector<HTMLInputElement>('input[name="input[id]"]')?.value

  const body = new FormData()
  body.set('_method', 'delete')
  body.set('authenticity_token', creds.token)
  if (inputId) body.set('input[id]', inputId)

  return submitForm(creds.action, body)
}

function extractFormCredentials(
  form: HTMLFormElement,
): { action: string; token: string } | null {
  const action = form.getAttribute('action')
  const token = form.querySelector<HTMLInputElement>('input[name="authenticity_token"]')?.value
  if (!action || !token) return null
  return { action, token }
}

async function submitForm(action: string, body: FormData): Promise<ActionOutcome> {
  try {
    const response = await fetch(action, {
      method: 'POST',
      body,
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
    })
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export function markCommentAsMinimized(commentEl: HTMLElement) {
  commentEl.classList.remove('unminimized-comment')
  commentEl.classList.add('minimized-comment')
  commentEl.style.opacity = '0.5'
}

export function removeCommentFromDom(commentEl: HTMLElement) {
  commentEl.remove()
}
