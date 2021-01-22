export default {
  Query: {
    findUniqueUser: (_parent, args, ctx) => {
      return ctx.prisma.user.findUnique(args)
    },
    findFirstUser: (_parent, args, ctx) => {
      return ctx.prisma.user.findFirst(args)
    },
    findManyUser: (_parent, args, ctx) => {
      return ctx.prisma.user.findMany(args)
    },
    findManyUserCount: (
      _parent,
      args,
      ctx,
    ) => {
      return ctx.prisma.user.count(args)
    },
    aggregateUser: (_parent, args, ctx) => {
      return ctx.prisma.user.aggregate(args)
    },
  },
  Mutation: {
    createOneUser: (_parent, args, ctx) => {
      return ctx.prisma.user.create(args)
    },
    updateOneUser: (_parent, args, ctx) => {
      return ctx.prisma.user.update(args)
    },
    deleteOneUser: async (
      _parent,
      args,
      ctx,
    ) => {
      await ctx.prisma
        .onDelete({ model: 'User', where: args.where })
      return ctx.prisma.user.delete(args)
    },
    upsertOneUser: async (
      _parent,
      args,
      ctx,
    ) => {
      return ctx.prisma.user.upsert(args)
    },
    deleteManyUser: async (
      _parent,
      args,
      ctx,
    ) => {
      await ctx.prisma
        .onDelete({ model: 'User', where: args.where })
      return ctx.prisma.user.deleteMany(args)
    },
    updateManyUser: (_parent, args, ctx) => {
      return ctx.prisma.user.updateMany(args)
    },
  },
}
