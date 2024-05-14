import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { PostsCollection, postsSlug } from './collections/Posts'
import { MenuGlobal, menuSlug } from './globals/Menu'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [
    PostsCollection,
    // ...add more collections here
  ],
  globals: [
    MenuGlobal,
    // ...add more globals here
  ],
  graphQL: {
    schemaOutputFile: './test/_community/schema.graphql',
  },

  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const { id } = await payload.create({
      collection: postsSlug,
      draft: false,
      data: {
        text: 'published example post',
      },
    })

    await payload.update({
      collection: postsSlug,
      draft: true,
      id,
      data: {
        text: 'draft example post',
      },
    })

    await payload.updateGlobal({
      slug: menuSlug,
      data: {
        relationship: id,
      },
    })

    console.log(
      await payload.findGlobal({
        slug: menuSlug,
        draft: true,
      }),
    )

    console.log(
      await payload.findByID({
        collection: postsSlug,
        draft: true,
        id,
      }),
    )
  },
})
