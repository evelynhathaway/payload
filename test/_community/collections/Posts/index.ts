import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
  slug: postsSlug,
}
