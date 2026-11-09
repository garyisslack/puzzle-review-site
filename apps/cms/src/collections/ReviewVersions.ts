import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { assertCanPublish } from '../access.ts'
import { applyServerScore } from '../score-review.ts'

const scoreOnSave: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!data) return data
  const role = (req.user as { role?: string } | null)?.role
  assertCanPublish(role, typeof data.status === 'string' ? data.status : undefined)
  return applyServerScore(data)
}

const dim = (name: string) => ({ name, type: 'number' as const, min: 0, max: 100 })

export const ReviewVersions: CollectionConfig = {
  slug: 'reviewVersions',
  hooks: { beforeChange: [scoreOnSave] },
  fields: [
    { name: 'gameSlug', type: 'text', required: true },
    { name: 'platform', type: 'select', required: true, options: ['ios', 'android'] },
    { name: 'reviewType', type: 'select', required: true, options: ['initial', 'full'] },
    { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: ['draft', 'published', 'expired', 'withdrawn'] },
    { name: 'sponsored', type: 'checkbox', defaultValue: false },
    dim('dimG'),
    dim('dimA'),
    dim('dimF'),
    dim('dimC'),
    dim('dimU'),
    { name: 'compositeTenths', type: 'number', admin: { readOnly: true } },
    { name: 'compositeRaw', type: 'number', admin: { readOnly: true } },
    { name: 'testingBoundaries', type: 'textarea' },
    { name: 'storeUrl', type: 'text' },
  ],
}
