import { CLASSIFIER_OPTIONS, type ReportedContentClassifier } from '../types'
import { markCommentAsMinimized, minimizeComment } from './minimize'
import { selection } from './selection'

let mounted = false

export function mountActionBar() {
  if (mounted) return
  mounted = true

  const bar = document.createElement('div')
  bar.id = 'pcs-action-bar'
  bar.hidden = true

  const countBadge = document.createElement('span')
  countBadge.className = 'pcs-count'

  const classifierSelect = document.createElement('select')
  classifierSelect.className = 'pcs-select'
  classifierSelect.setAttribute('aria-label', 'Reason')
  for (const opt of CLASSIFIER_OPTIONS) {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.label
    classifierSelect.append(option)
  }

  const statusText = document.createElement('span')
  statusText.className = 'pcs-status'

  const setBusy = (busy: boolean) => {
    hideButton.disabled = busy
    clearButton.disabled = busy
    classifierSelect.disabled = busy
  }

  const runHide = async () => {
    const ids = selection.values()
    if (ids.length === 0) return
    const classifier = classifierSelect.value as ReportedContentClassifier

    setBusy(true)
    let succeeded = 0
    const failed: { id: string; error: string }[] = []

    for (const [index, id] of ids.entries()) {
      statusText.textContent = `${index + 1} / ${ids.length} hidden...`
      const commentEl = selection.commentEl(id)
      if (!commentEl) {
        failed.push({ id, error: 'comment element gone' })
        continue
      }
      const outcome = await minimizeComment(commentEl, classifier)
      if (outcome.ok) {
        succeeded += 1
        markCommentAsMinimized(commentEl)
        selection.delete(id)
      } else {
        failed.push({ id, error: outcome.error })
      }
    }

    statusText.textContent = ''
    setBusy(false)
    showToast(summarize(succeeded, failed))
  }

  const hideButton = makeButton({
    label: 'Hide',
    primary: true,
    onClick: () => {
      void runHide()
    },
  })

  const clearButton = makeButton({
    label: 'Clear',
    onClick: () => selection.clear(),
  })

  bar.append(countBadge, classifierSelect, hideButton, clearButton, statusText)
  document.body.append(bar)

  selection.subscribe((size) => {
    bar.hidden = size === 0
    countBadge.textContent = `${size} selected`
    hideButton.textContent = size > 0 ? `Hide ${size}` : 'Hide'
  })
}

function makeButton(opts: {
  label: string
  primary?: boolean
  onClick: () => void
}): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = opts.primary ? 'pcs-btn pcs-btn-primary' : 'pcs-btn'
  btn.textContent = opts.label
  btn.addEventListener('click', opts.onClick)
  return btn
}

function summarize(succeeded: number, failed: { error: string }[]): string {
  if (failed.length === 0) {
    return `${succeeded} comment${succeeded === 1 ? '' : 's'} hidden`
  }
  const firstError = failed[0]?.error ?? ''
  return `${succeeded} hidden, ${failed.length} failed (${firstError})`
}

let toastEl: HTMLDivElement | null = null
let toastTimer: number | undefined

function showToast(message: string) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.id = 'pcs-toast'
    document.body.append(toastEl)
  }
  toastEl.textContent = message
  toastEl.classList.add('pcs-toast-visible')
  if (toastTimer !== undefined) clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastEl?.classList.remove('pcs-toast-visible')
    toastTimer = undefined
  }, 3000)
}
