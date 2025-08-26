import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { TenantsCollection } from './collections/Tenants/index.js'
import { UsersCollection } from './collections/Users/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  blocks: [
    {
      slug: 'myBlock',
      fields: [
        {
          name: 'myRelationship',
          type: 'relationship',
          relationTo: 'posts',
          admin: {
            appearance: 'drawer',
          },
        },
      ],
    },
  ],
  plugins: [
    multiTenantPlugin({
      userHasAccessToAllTenants: () => true,
      useTenantsCollectionAccess: false,
      tenantField: {
        access: {},
      },
      collections: {
        [PostsCollection.slug]: {
          useTenantAccess: false,
        },
        [MediaCollection.slug]: {
          useTenantAccess: false,
        },
      },
    }),
  ],
  collections: [UsersCollection, PostsCollection, MediaCollection, TenantsCollection],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  globals: [
    // ...add more globals here
    MenuGlobal,
  ],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const tenantA = await payload.create({
      collection: 'tenants',
      data: {
        name: 'tenant a',
      },
    })

    const tenantB = await payload.create({
      collection: 'tenants',
      data: {
        name: 'tenant b',
      },
    })

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'example post',
        tenant: tenantA.id,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
