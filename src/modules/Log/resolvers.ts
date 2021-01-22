export default {
  Query: {
    findUniqueLog: (_parent, args, ctx) => {
      return ctx.prisma.log.findUnique(args);
    },
    findFirstLog: (_parent, args, ctx) => {
      return ctx.prisma.log.findFirst(args);
    },
    findManyLog: (_parent, args, ctx) => {
      return ctx.prisma.log.findMany(args);
    },
    findManyLogCount: (_parent, args, ctx) => {
      return ctx.prisma.log.count(args);
    },
    aggregateLog: (_parent, args, ctx) => {
      return ctx.prisma.log.aggregate(args);
    },
  },
  Mutation: {
    createOneLog: (_parent, args, ctx) => {
      return ctx.prisma.log.create(args);
    },
    updateOneLog: (_parent, args, ctx) => {
      return ctx.prisma.log.update(args);
    },
    deleteOneLog: async (_parent, args, ctx) => {
      await ctx.prisma.onDelete({ model: "Log", where: args.where });
      return ctx.prisma.log.delete(args);
    },
    upsertOneLog: async (_parent, args, ctx) => {
      return ctx.prisma.log.upsert(args);
    },
    deleteManyLog: async (_parent, args, ctx) => {
      await ctx.prisma.onDelete({ model: "Log", where: args.where });
      return ctx.prisma.log.deleteMany(args);
    },
    updateManyLog: (_parent, args, ctx) => {
      return ctx.prisma.log.updateMany(args);
    },
  },
};
