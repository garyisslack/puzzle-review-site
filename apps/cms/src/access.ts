export function assertCanPublish(role: string | undefined, status: string | undefined): void {
  if (status === 'published' && role === 'editor') {
    throw new Error('Editor cannot publish')
  }
}

export function submissionCreateAllowed(authorization: string | null, token: string | undefined): boolean {
  return Boolean(token && token.length >= 16 && authorization === `Bearer ${token}`)
}
