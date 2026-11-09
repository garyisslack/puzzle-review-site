import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { GuideSubmissions } from './collections/GuideSubmissions.ts'
import { Guides } from './collections/Guides.ts'
import { ReviewVersions } from './collections/ReviewVersions.ts'
import { Users } from './collections/Users.ts'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseUri = process.env.DATABASE_URI
const postgres = databaseUri?.startsWith('postgres')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Users, ReviewVersions, Guides, GuideSubmissions],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-dev-secret-dev-secret',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgres
    ? postgresAdapter({ pool: { connectionString: databaseUri } })
    : sqliteAdapter({ client: { url: databaseUri || 'file:./data.db' } }),
  sharp,
})
