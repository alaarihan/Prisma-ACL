import { prisma } from "../../common/prisma";

export default {
  Query: {
    findUniqueUser: (_parent, args) => {
      return prisma.user.findUnique(args);
    },
    findFirstUser: (_parent, args) => {
      return prisma.user.findFirst(args);
    },
    findManyUser: (_parent, args) => {
      return prisma.user.findMany(args);
    },
    findManyUserCount: (_parent, args) => {
      return prisma.user.count(args);
    },
    aggregateUser: (_parent, args) => {
      return prisma.user.aggregate(args);
    },
  },
  Mutation: {
    createOneUser: (_parent, args) => {
      return prisma.user.create(args);
    },
    updateOneUser: (_parent, args) => {
      return prisma.user.update(args);
    },
    deleteOneUser: async (_parent, args) => {
      await prisma.onDelete({ model: "User", where: args.where });
      return prisma.user.delete(args);
    },
    upsertOneUser: async (_parent, args) => {
      return prisma.user.upsert(args);
    },
    deleteManyUser: async (_parent, args) => {
      await prisma.onDelete({ model: "User", where: args.where });
      return prisma.user.deleteMany(args);
    },
    updateManyUser: (_parent, args) => {
      return prisma.user.updateMany(args);
    },
  },
};
