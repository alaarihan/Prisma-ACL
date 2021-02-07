import { objectType, arg, extendType } from 'nexus'

export const Salat = objectType({
  name: 'Salat',
  definition(t) {
    t.model.id()
    t.model.authorId()
    t.model.author()
    t.model.name()
    t.model.createdAt()
    t.model.updatedAt()
  },
})

export const salatQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.salat()
    t.field('findFirstSalat', {
      type: 'Salat',
      args: {
        where: 'SalatWhereInput',
        orderBy: arg({ type: 'SalatOrderByInput' }),
        cursor: 'SalatWhereUniqueInput',
        skip: 'Int',
        take: 'Int',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.salat.findFirst(args as any)
      },
    })
    t.crud.salats({ filtering: true, ordering: true })
    t.field('salatsCount', {
      type: 'Int',
      args: {
        where: 'SalatWhereInput',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.salat.count(args as any)
      },
    })
  },
})

export const salatMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.crud.createOneSalat()
    t.crud.updateOneSalat()
    t.crud.upsertOneSalat()
    t.crud.deleteOneSalat()
    t.crud.updateManySalat()
    t.crud.deleteManySalat()
  },
})
