import type { ReportedContentClassifier } from '../types'

const ENDPOINT = 'https://api.github.com/graphql'

const MINIMIZE_MUTATION = `
mutation Minimize($id: ID!, $classifier: ReportedContentClassifiers!) {
  minimizeComment(input: { subjectId: $id, classifier: $classifier }) {
    minimizedComment { isMinimized minimizedReason }
  }
}
`.trim()

type GraphQLResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type MinimizeData = {
  minimizeComment: {
    minimizedComment: {
      isMinimized: boolean
      minimizedReason: string | null
    } | null
  } | null
}

export type MinimizeResult = {
  isMinimized: boolean
  minimizedReason: string | null
}

export async function minimizeComment(
  pat: string,
  subjectId: string,
  classifier: ReportedContentClassifier,
): Promise<MinimizeResult> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: MINIMIZE_MUTATION,
      variables: { id: subjectId, classifier },
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const json = (await response.json()) as GraphQLResponse<MinimizeData>

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }

  const minimized = json.data?.minimizeComment?.minimizedComment
  if (!minimized) {
    throw new Error('minimizeComment returned no data')
  }

  return minimized
}
