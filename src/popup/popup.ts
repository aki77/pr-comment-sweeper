import { clearPat, getPat, setPat } from '../lib/storage'

const form = document.getElementById('pat-form') as HTMLFormElement
const input = document.getElementById('pat') as HTMLInputElement
const clearBtn = document.getElementById('clear') as HTMLButtonElement
const status = document.getElementById('status') as HTMLParagraphElement

async function init() {
  const existing = await getPat()
  if (existing) {
    input.value = existing
    input.placeholder = 'saved'
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const value = input.value.trim()
  if (!value) {
    setStatus('Token is empty', 'err')
    return
  }
  await setPat(value)
  setStatus('Saved', 'ok')
})

clearBtn.addEventListener('click', async () => {
  await clearPat()
  input.value = ''
  setStatus('Cleared', 'ok')
})

function setStatus(message: string, kind: 'ok' | 'err') {
  status.textContent = message
  status.classList.remove('ok', 'err')
  status.classList.add(kind)
}

void init()
