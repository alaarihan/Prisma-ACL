import { objectType, arg, extendType } from 'nexus'

export const FieldAccess = objectType({
  name: 'FieldAccess',
  definition(t) {
    t.model.id()
    t.model.roleAccessId()
    t.model.name()
    t.model.create()
    t.model.read()
    t.model.update()
    t.model.delete()
    t.model.createdAt()
    t.model.updatedAt()
    t.model.roleAccess()
  },
})

export const fieldAccessQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.fieldAccess()
    t.field('findFirstFieldAccess', {
      type: 'FieldAccess',
      args: {
        where: 'FieldAccessWhereInput',
        orderBy: arg({ type: 'FieldAccessOrderByInput' }),
        cursor: 'FieldAccessWhereUniqueInput',
        skip: 'Int',
        take: 'Int',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.fieldAccess.findFirst(args as any)
      },
    })
    t.crud.fieldAccesses({ filtering: true, ordering: true })
    t.field('fieldAccessesCount', {
      type: 'Int',
      args: {
        where: 'FieldAccessWhereInput',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.fieldAccess.count(args as any)
      },
    })
  },
})

export const fieldAccessMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.crud.createOneFieldAccess()
    t.crud.updateOneFieldAccess()
    t.crud.upsertOneFieldAccess()
    t.crud.deleteOneFieldAccess()
    t.crud.updateManyFieldAccess()
    t.crud.deleteManyFieldAccess()
  },
})
