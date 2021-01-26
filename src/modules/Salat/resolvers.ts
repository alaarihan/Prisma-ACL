import { prisma } from "../../common/prisma";

export default {
  Query: {
    findUniqueSalat: (_parent, args) => {
      return prisma.salat.findUnique(args);
    },
    findFirstSalat: (_parent, args) => {
      return prisma.salat.findFirst(args);
    },
    findManySalat: (_parent, args) => {
      return prisma.salat.findMany(args);
    },
    findManySalatCount: (_parent, args) => {
      return prisma.salat.count(args);
    },
    aggregateSalat: (_parent, args) => {
      return prisma.salat.aggregate(args);
    },
  },
  Mutation: {
    createOneSalat: (_parent, args) => {
      return prisma.salat.create(args);
    },
    updateOneSalat: (_parent, args) => {
      return prisma.salat.update(args);
    },
    deleteOneSalat: async (_parent, args) => {
      await prisma.onDelete({ model: "Salat", where: args.where });
      return prisma.salat.delete(args);
    },
    upsertOneSalat: async (_parent, args) => {
      return prisma.salat.upsert(args);
    },
    deleteManySalat: async (_parent, args) => {
      await prisma.onDelete({ model: "Salat", where: args.where });
      return prisma.salat.deleteMany(args);
    },
    updateManySalat: (_parent, args) => {
      return prisma.salat.updateMany(args);
    },
  },
};
