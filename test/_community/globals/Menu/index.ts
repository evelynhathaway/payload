import type { GlobalConfig } from '../../../../packages/payload/src/globals/config/types'

export const menuSlug = 'menu'

export const MenuGlobal: GlobalConfig = {
  slug: menuSlug,
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: 'posts',
    },
  ],
}
