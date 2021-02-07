import { objectType, arg, extendType } from 'nexus'

export const Category = objectType({
  name: 'Category',
  definition(t) {
    t.model.id()
    t.model.name()
    t.model.posts()
    t.model.createdAt()
    t.model.updatedAt()
  },
})

export const categoryQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.category()
    t.field('findFirstCategory', {
      type: 'Category',
      args: {
        where: 'CategoryWhereInput',
        orderBy: arg({ type: 'CategoryOrderByInput' }),
        cursor: 'CategoryWhereUniqueInput',
        skip: 'Int',
        take: 'Int',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.category.findFirst(args as any)
      },
    })
    t.crud.categories({ filtering: true, ordering: true })
    t.field('categoriesCount', {
      type: 'Int',
      args: {
        where: 'CategoryWhereInput',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.category.count(args as any)
      },
    })
  },
})

export const categoryMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.crud.createOneCategory()
    t.crud.updateOneCategory()
    t.crud.upsertOneCategory()
    t.crud.deleteOneCategory()
    t.crud.updateManyCategory()
    t.crud.deleteManyCategory()
  },
})
