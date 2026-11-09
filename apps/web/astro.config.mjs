import { defineConfig } from 'astro/config'
import { compareRedirects } from './src/lib/site.ts'

export default defineConfig({
  site: 'https://puzzlereviewlab.com',
  trailingSlash: 'always',
  redirects: compareRedirects(),
})
