import { objectType, arg, extendType } from 'nexus'

export const RoleAccess = objectType({
  name: 'RoleAccess',
  definition(t) {
    t.model.id()
    t.model.role()
    t.model.type()
    t.model.create()
    t.model.read()
    t.model.update()
    t.model.delete()
    t.model.createdAt()
    t.model.updatedAt()
    t.model.fields()
  },
})

export const roleAccessQuery = extendType({
  type: 'Query',
  definition(t) {
    t.crud.roleAccess()
    t.field('findFirstRoleAccess', {
      type: 'RoleAccess',
      args: {
        where: 'RoleAccessWhereInput',
        orderBy: arg({ type: 'RoleAccessOrderByInput' }),
        cursor: 'RoleAccessWhereUniqueInput',
        skip: 'Int',
        take: 'Int',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.roleAccess.findFirst(args as any)
      },
    })
    t.crud.roleAccesses({ filtering: true, ordering: true })
    t.field('roleAccessesCount', {
      type: 'Int',
      args: {
        where: 'RoleAccessWhereInput',
      },
      async resolve(_root, args, ctx) {
        return ctx.prisma.roleAccess.count(args as any)
      },
    })
  },
})

export const roleAccessMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.crud.createOneRoleAccess()
    t.crud.updateOneRoleAccess()
    t.crud.upsertOneRoleAccess()
    t.crud.deleteOneRoleAccess()
    t.crud.updateManyRoleAccess()
    t.crud.deleteManyRoleAccess()
  },
})
