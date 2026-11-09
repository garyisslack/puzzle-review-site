import type { CollectionConfig } from 'payload'
import { submissionCreateAllowed } from '../access.ts'

export const GuideSubmissions: CollectionConfig = {
  slug: 'guideSubmissions',
  access: {
    create: ({ req }) => submissionCreateAllowed(req.headers.get('authorization'), process.env.GUIDE_SUBMIT_TOKEN),
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'gameSlug', type: 'text', required: true },
    { name: 'platform', type: 'select', required: true, options: ['ios', 'android'] },
    { name: 'appVersion', type: 'text', required: true },
    { name: 'levelRange', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'penName', type: 'text', required: true },
    { name: 'contactEmail', type: 'email' },
    { name: 'aiAssisted', type: 'checkbox' },
    { name: 'piiFlags', type: 'text', hasMany: true },
    { name: 'ipHash', type: 'text' },
    { name: 'status', type: 'select', defaultValue: 'pending', options: ['pending', 'needs_changes', 'approved', 'rejected', 'spam'] },
  ],
}
