import { writeFileSync } from 'node:fs'
import { compareRedirects } from '../src/lib/site.ts'

const lines = Object.entries(compareRedirects()).map(([from, to]) => `${from} ${to} 301`)
writeFileSync(new URL('../public/_redirects', import.meta.url), `${lines.join('\n')}\n`)
