import {
  ACTION_LABELS,
  type Action,
  type ActionRequest,
  markCommentAsMinimized,
  performAction,
  removeCommentFromDom,
} from './actions'
import { selection } from './selection'
import { CLASSIFIER_OPTIONS, type ReportedContentClassifier } from '../types'

const MAX_CONCURRENCY = 5

let mounted = false

export function mountActionBar() {
  if (mounted) return
  mounted = true

  let currentMode: Action = 'hide'

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

  const actionButton = makeButton({
    label: ACTION_LABELS.hide.verb,
    variant: 'primary',
    onClick: () => {
      void runAction()
    },
  })

  const clearButton = makeButton({
    label: 'Clear',
    onClick: () => selection.clear(),
  })

  const modeToggle = makeModeToggle((mode) => {
    currentMode = mode
    classifierSelect.disabled = mode === 'delete'
    syncActionButtonAppearance(selection.values().length)
  })

  const setBusy = (busy: boolean) => {
    actionButton.disabled = busy
    clearButton.disabled = busy
    classifierSelect.disabled = busy || currentMode === 'delete'
    modeToggle.setDisabled(busy)
  }

  const syncActionButtonAppearance = (size: number) => {
    const { verb } = ACTION_LABELS[currentMode]
    actionButton.textContent = size > 0 ? `${verb} ${size}` : verb
    actionButton.classList.toggle('pcs-btn-primary', currentMode === 'hide')
    actionButton.classList.toggle('pcs-btn-danger', currentMode === 'delete')
  }

  const runAction = () =>
    selection.batch(async () => {
      const ids = selection.values()
      if (ids.length === 0) return

      if (currentMode === 'delete') {
        const noun = ids.length === 1 ? 'comment' : 'comments'
        const message = `${ids.length} ${noun} will be permanently deleted. This cannot be undone. Continue?`
        if (!window.confirm(message)) return
      }

      const mode = currentMode
      const { verbDone } = ACTION_LABELS[mode]
      const classifier = classifierSelect.value as ReportedContentClassifier
      const request: ActionRequest =
        mode === 'hide' ? { action: 'hide', classifier } : { action: 'delete' }

      const onSuccess = mode === 'hide' ? markCommentAsMinimized : removeCommentFromDom

      setBusy(true)
      let succeeded = 0
      let processed = 0
      const failed: { id: string; error: string }[] = []

      let statusRaf = 0
      const scheduleStatusUpdate = () => {
        if (statusRaf) return
        statusRaf = requestAnimationFrame(() => {
          statusRaf = 0
          statusText.textContent = `${processed} / ${ids.length} ${verbDone}...`
        })
      }
      scheduleStatusUpdate()

      const processOne = async (id: string) => {
        const commentEl = selection.commentEl(id)
        if (!commentEl) {
          failed.push({ id, error: 'comment element gone' })
          return
        }
        const outcome = await performAction(commentEl, request)
        if (outcome.ok) {
          succeeded += 1
          onSuccess(commentEl)
          selection.unregister(id)
        } else {
          failed.push({ id, error: outcome.error })
        }
      }

      let cursor = 0
      const worker = async () => {
        while (cursor < ids.length) {
          const i = cursor++
          const id = ids[i]
          if (id === undefined) return
          await processOne(id)
          processed += 1
          scheduleStatusUpdate()
        }
      }
      const concurrency = Math.min(MAX_CONCURRENCY, ids.length)
      await Promise.all(Array.from({ length: concurrency }, () => worker()))

      if (statusRaf) cancelAnimationFrame(statusRaf)
      statusText.textContent = ''
      setBusy(false)
      showToast(summarize(mode, succeeded, failed))
    })

  bar.append(countBadge, modeToggle.root, classifierSelect, actionButton, clearButton, statusText)
  document.body.append(bar)

  selection.subscribe((size) => {
    bar.hidden = size === 0
    countBadge.textContent = `${size} selected`
    syncActionButtonAppearance(size)
  })
}

type ModeToggle = {
  root: HTMLElement
  setDisabled(disabled: boolean): void
}

function makeModeToggle(onChange: (mode: Action) => void): ModeToggle {
  const root = document.createElement('fieldset')
  root.className = 'pcs-mode'

  const make = (mode: Action, checked: boolean) => {
    const wrapper = document.createElement('label')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'pcs-mode'
    input.value = mode
    input.checked = checked
    input.addEventListener('change', () => {
      if (input.checked) onChange(mode)
    })
    wrapper.append(input, document.createTextNode(ACTION_LABELS[mode].verb))
    return { wrapper, input }
  }

  const hide = make('hide', true)
  const del = make('delete', false)
  root.append(hide.wrapper, del.wrapper)

  return {
    root,
    setDisabled(disabled) {
      hide.input.disabled = disabled
      del.input.disabled = disabled
    },
  }
}

type ButtonVariant = 'primary' | 'danger' | 'default'

function makeButton(opts: {
  label: string
  variant?: ButtonVariant
  onClick: () => void
}): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'pcs-btn'
  if (opts.variant === 'primary') btn.classList.add('pcs-btn-primary')
  else if (opts.variant === 'danger') btn.classList.add('pcs-btn-danger')
  btn.textContent = opts.label
  btn.addEventListener('click', opts.onClick)
  return btn
}

function summarize(
  mode: Action,
  succeeded: number,
  failed: { error: string }[],
): string {
  const { verbDone } = ACTION_LABELS[mode]
  if (failed.length === 0) {
    return `${succeeded} comment${succeeded === 1 ? '' : 's'} ${verbDone}`
  }
  const firstError = failed[0]?.error ?? ''
  return `${succeeded} ${verbDone}, ${failed.length} failed (${firstError})`
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
