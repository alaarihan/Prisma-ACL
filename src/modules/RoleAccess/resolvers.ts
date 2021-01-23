import { prisma } from "../../common/prisma";

export default {
  Query: {
    findUniqueRoleAccess: (_parent, args) => {
      return prisma.roleAccess.findUnique(args);
    },
    findFirstRoleAccess: (_parent, args) => {
      return prisma.roleAccess.findFirst(args);
    },
    findManyRoleAccess: (_parent, args) => {
      return prisma.roleAccess.findMany(args);
    },
    findManyRoleAccessCount: (_parent, args) => {
      return prisma.roleAccess.count(args);
    },
    aggregateRoleAccess: (_parent, args) => {
      return prisma.roleAccess.aggregate(args);
    },
  },
  Mutation: {
    createOneRoleAccess: (_parent, args) => {
      return prisma.roleAccess.create(args);
    },
    updateOneRoleAccess: (_parent, args) => {
      return prisma.roleAccess.update(args);
    },
    deleteOneRoleAccess: async (_parent, args) => {
      await prisma.onDelete({ model: "RoleAccess", where: args.where });
      return prisma.roleAccess.delete(args);
    },
    upsertOneRoleAccess: async (_parent, args) => {
      return prisma.roleAccess.upsert(args);
    },
    deleteManyRoleAccess: async (_parent, args) => {
      await prisma.onDelete({ model: "RoleAccess", where: args.where });
      return prisma.roleAccess.deleteMany(args);
    },
    updateManyRoleAccess: (_parent, args) => {
      return prisma.roleAccess.updateMany(args);
    },
  },
};
