import { prisma } from "../../common/prisma";

export default {
  Query: {
    findUniqueCategory: (_parent, args) => {
      return prisma.category.findUnique(args);
    },
    findFirstCategory: (_parent, args) => {
      return prisma.category.findFirst(args);
    },
    findManyCategory: (_parent, args) => {
      return prisma.category.findMany(args);
    },
    findManyCategoryCount: (_parent, args) => {
      return prisma.category.count(args);
    },
    aggregateCategory: (_parent, args) => {
      return prisma.category.aggregate(args);
    },
  },
  Mutation: {
    createOneCategory: (_parent, args) => {
      return prisma.category.create(args);
    },
    updateOneCategory: (_parent, args) => {
      return prisma.category.update(args);
    },
    deleteOneCategory: async (_parent, args) => {
      await prisma.onDelete({ model: "Category", where: args.where });
      return prisma.category.delete(args);
    },
    upsertOneCategory: async (_parent, args) => {
      return prisma.category.upsert(args);
    },
    deleteManyCategory: async (_parent, args) => {
      await prisma.onDelete({ model: "Category", where: args.where });
      return prisma.category.deleteMany(args);
    },
    updateManyCategory: (_parent, args) => {
      return prisma.category.updateMany(args);
    },
  },
};
