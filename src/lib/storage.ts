const PAT_KEY = 'pat'

export async function getPat(): Promise<string | null> {
  const result = await chrome.storage.local.get(PAT_KEY)
  const value = result[PAT_KEY]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export async function setPat(pat: string): Promise<void> {
  await chrome.storage.local.set({ [PAT_KEY]: pat })
}

export async function clearPat(): Promise<void> {
  await chrome.storage.local.remove(PAT_KEY)
}
