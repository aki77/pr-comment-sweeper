import type { MinimizeRequest, MinimizeResponse } from '../lib/messages'
import { CLASSIFIER_OPTIONS, type ReportedContentClassifier } from '../types'
import { uncheckById } from './checkbox'
import { selection } from './selection'

let bar: HTMLDivElement | null = null
let countBadge: HTMLSpanElement
let classifierSelect: HTMLSelectElement
let hideButton: HTMLButtonElement
let clearButton: HTMLButtonElement
let statusText: HTMLSpanElement
let toastEl: HTMLDivElement | null = null

export function mountActionBar() {
  if (bar) return

  bar = document.createElement('div')
  bar.id = 'pcs-action-bar'
  bar.hidden = true

  countBadge = document.createElement('span')
  countBadge.className = 'pcs-count'

  classifierSelect = document.createElement('select')
  classifierSelect.className = 'pcs-select'
  classifierSelect.setAttribute('aria-label', 'Reason')
  for (const opt of CLASSIFIER_OPTIONS) {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.label
    classifierSelect.append(option)
  }

  hideButton = document.createElement('button')
  hideButton.type = 'button'
  hideButton.className = 'pcs-btn pcs-btn-primary'
  hideButton.textContent = 'Hide'
  hideButton.addEventListener('click', () => {
    void runHide()
  })

  clearButton = document.createElement('button')
  clearButton.type = 'button'
  clearButton.className = 'pcs-btn'
  clearButton.textContent = 'Clear'
  clearButton.addEventListener('click', () => {
    for (const id of selection.values()) uncheckById(id)
    selection.clear()
  })

  statusText = document.createElement('span')
  statusText.className = 'pcs-status'

  bar.append(countBadge, classifierSelect, hideButton, clearButton, statusText)
  document.body.append(bar)

  selection.subscribe((size) => {
    if (!bar) return
    bar.hidden = size === 0
    countBadge.textContent = `${size} selected`
    hideButton.textContent = size > 0 ? `Hide ${size}` : 'Hide'
  })
}

async function runHide() {
  const ids = selection.values()
  if (ids.length === 0) return

  const classifier = classifierSelect.value as ReportedContentClassifier

  setBusy(true)
  let succeeded = 0
  const failed: { id: string; error: string }[] = []

  for (const [index, id] of ids.entries()) {
    statusText.textContent = `${index} / ${ids.length} hidden...`
    const response = await sendMinimize(id, classifier)
    if (response.ok && response.isMinimized) {
      succeeded += 1
      uncheckById(id)
      selection.delete(id)
    } else {
      const error = response.ok ? 'not minimized' : response.error
      failed.push({ id, error })
    }
  }

  statusText.textContent = ''
  setBusy(false)

  if (failed.length === 0) {
    showToast(`${succeeded} comment${succeeded === 1 ? '' : 's'} hidden`)
  } else {
    const firstError = failed[0]?.error ?? ''
    const reason = firstError === 'PAT_MISSING' ? '(set PAT in popup)' : `(${firstError})`
    showToast(`${succeeded} hidden, ${failed.length} failed ${reason}`)
  }
}

function sendMinimize(
  subjectId: string,
  classifier: ReportedContentClassifier,
): Promise<MinimizeResponse> {
  const request: MinimizeRequest = { type: 'MINIMIZE_COMMENT', subjectId, classifier }
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(request, (response: MinimizeResponse | undefined) => {
      const err = chrome.runtime.lastError
      if (err) {
        resolve({ ok: false, error: err.message ?? 'runtime error' })
        return
      }
      if (!response) {
        resolve({ ok: false, error: 'no response from background' })
        return
      }
      resolve(response)
    })
  })
}

function setBusy(busy: boolean) {
  hideButton.disabled = busy
  clearButton.disabled = busy
  classifierSelect.disabled = busy
}

function showToast(message: string) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.id = 'pcs-toast'
    document.body.append(toastEl)
  }
  toastEl.textContent = message
  toastEl.classList.add('pcs-toast-visible')
  setTimeout(() => {
    toastEl?.classList.remove('pcs-toast-visible')
  }, 3000)
}
