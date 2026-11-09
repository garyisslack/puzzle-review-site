import type { CollectionConfig } from 'payload'

export const Guides: CollectionConfig = {
  slug: 'guides',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'gameSlug', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'platform', type: 'select', required: true, options: ['ios', 'android'] },
    { name: 'levelRange', type: 'text', required: true },
    { name: 'verifiedOnVersion', type: 'text' },
    { name: 'contributorName', type: 'text', required: true },
    { name: 'verifiedBy', type: 'text' },
    { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: ['draft', 'verified'] },
    { name: 'piiCleared', type: 'checkbox', defaultValue: false },
  ],
}
