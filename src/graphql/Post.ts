import { objectType, arg, extendType } from 'nexus'

export const Post = objectType({
  name: 'Post',
  definition(t) {
    t.model.id()
    t.model.authorId()
    t.model.author()
    t.model.name()
    t.model.content()
    t.model.categories()
    t.model.createdAt()
    t.model.updatedAt()
  },
})

export const postQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.post()
    t.field('findFirstPost', {
      type: 'Post',
      args: {
        where: 'PostWhereInput',
        orderBy: arg({ type: 'PostOrderByInput' }),
        cursor: 'PostWhereUniqueInput',
        skip: 'Int',
        take: 'Int',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.post.findFirst(args as any)
      },
    })
    t.crud.posts({ filtering: true, ordering: true })
    t.field('postsCount', {
      type: 'Int',
      args: {
        where: 'PostWhereInput',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.post.count(args as any)
      },
    })
  },
})

export const postMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.crud.createOnePost()
    t.crud.updateOnePost()
    t.crud.upsertOnePost()
    t.crud.deleteOnePost()
    t.crud.updateManyPost()
    t.crud.deleteManyPost()
  },
})
