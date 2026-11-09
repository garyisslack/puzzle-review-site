import { defineConfig } from 'astro/config'
import { compareRedirects } from './src/lib/site.ts'

export default defineConfig({
  site: 'https://example.com',
  trailingSlash: 'always',
  redirects: compareRedirects(),
})
