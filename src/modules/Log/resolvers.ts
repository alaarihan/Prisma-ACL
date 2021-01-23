import { prisma } from '../../common/prisma'

export default {
  Query: {
    findUniqueLog: (_parent, args, ctx) => {
      return prisma.log.findUnique(args);
    },
    findFirstLog: (_parent, args, ctx) => {
      return prisma.log.findFirst(args);
    },
    findManyLog: (_parent, args, ctx) => {
      return prisma.log.findMany(args);
    },
    findManyLogCount: (_parent, args, ctx) => {
      return prisma.log.count(args);
    },
    aggregateLog: (_parent, args, ctx) => {
      return prisma.log.aggregate(args);
    },
  },
  Mutation: {
    createOneLog: (_parent, args, ctx) => {
      return prisma.log.create(args);
    },
    updateOneLog: (_parent, args, ctx) => {
      return prisma.log.update(args);
    },
    deleteOneLog: async (_parent, args, ctx) => {
      await prisma.onDelete({ model: "Log", where: args.where });
      return prisma.log.delete(args);
    },
    upsertOneLog: async (_parent, args, ctx) => {
      return prisma.log.upsert(args);
    },
    deleteManyLog: async (_parent, args, ctx) => {
      await prisma.onDelete({ model: "Log", where: args.where });
      return prisma.log.deleteMany(args);
    },
    updateManyLog: (_parent, args, ctx) => {
      return prisma.log.updateMany(args);
    },
  },
};
