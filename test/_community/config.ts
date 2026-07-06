import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { layoutBlocks, rootBlockSlugs } from './blocks/index.js'
import { MediaCollection } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Reproduction: a generic "layout builder" made of blocks that reference each other by slug (via
 * the config-level `blocks` registry). Because the Mongoose adapter builds a brand-new
 * `mongoose.Schema` for every occurrence of a block along every path through the block-reference
 * graph — with no memoization — and does so once for each collection AND once more for each
 * drafts-enabled collection's `_versions` schema, the number of Schema instances explodes into the
 * hundreds of thousands even though there are only ~35 blocks and 3 collections.
 */

// A collection whose layout is built from the block set. Drafts are enabled, which doubles the
// schema cost (Payload builds a separate `_versions` schema tree).
const layoutCollection = (slug: string, layoutFieldCount: number) => ({
  slug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text' as const },
    // One or more top-level layout fields, each offering the root blocks.
    ...Array.from({ length: layoutFieldCount }, (_, index) => ({
      name: index === 0 ? 'layout' : `layout${index + 1}`,
      type: 'blocks' as const,
      blocks: rootBlockSlugs,
    })),
  ],
  versions: { drafts: true },
})

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  blocks: layoutBlocks,
  collections: [
    // Pages embeds the layout twice (e.g. a header layout + a body layout)
    layoutCollection('pages', 2),
    layoutCollection('sections', 1),
    layoutCollection('landingPages', 1),
    layoutCollection('marketingPages', 1),
    layoutCollection('campaigns', 1),
    layoutCollection('guides', 1),
    PostsCollection,
    MediaCollection,
  ],
  editor: lexicalEditor({}),
  globals: [MenuGlobal],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    await payload.create({
      collection: postsSlug,
      data: {
        title: 'example post',
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
