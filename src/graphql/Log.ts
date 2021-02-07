import { objectType, arg, extendType } from 'nexus'

export const Log = objectType({
  name: 'Log',
  definition(t) {
    t.model.id()
    t.model.operation()
    t.model.message()
    t.model.ip()
    t.model.host()
    t.model.userAgent()
    t.model.authorId()
    t.model.author()
    t.model.referer()
    t.model.createdAt()
  },
})

export const logQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.log()
    t.field('findFirstLog', {
      type: 'Log',
      args: {
        where: 'LogWhereInput',
        orderBy: arg({ type: 'LogOrderByInput' }),
        cursor: 'LogWhereUniqueInput',
        skip: 'Int',
        take: 'Int',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.log.findFirst(args as any)
      },
    })
    t.crud.logs({ filtering: true, ordering: true })
    t.field('logsCount', {
      type: 'Int',
      args: {
        where: 'LogWhereInput',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.log.count(args as any)
      },
    })
  },
})

export const logMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.crud.createOneLog()
    t.crud.updateOneLog()
    t.crud.upsertOneLog()
    t.crud.deleteOneLog()
    t.crud.updateManyLog()
    t.crud.deleteManyLog()
  },
})
