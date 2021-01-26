import { prisma } from "../../common/prisma";

export default {
  Query: {
    findUniquePost: (_parent, args, ) => {
      return prisma.post.findUnique(args)
    },
    findFirstPost: (_parent, args, ) => {
      return prisma.post.findFirst(args)
    },
    findManyPost: (_parent, args, ) => {
      return prisma.post.findMany(args)
    },
    findManyPostCount: (
      _parent,
      args,
      
    ) => {
      return prisma.post.count(args)
    },
    aggregatePost: (_parent, args, ) => {
      return prisma.post.aggregate(args)
    },
  },
  Mutation: {
    createOnePost: (_parent, args, ) => {
      return prisma.post.create(args)
    },
    updateOnePost: (_parent, args, ) => {
      return prisma.post.update(args)
    },
    deleteOnePost: async (
      _parent,
      args,
      
    ) => {
      await prisma
        .onDelete({ model: 'Post', where: args.where })
      return prisma.post.delete(args)
    },
    upsertOnePost: async (
      _parent,
      args,
      
    ) => {
      return prisma.post.upsert(args)
    },
    deleteManyPost: async (
      _parent,
      args,
      
    ) => {
      await prisma
        .onDelete({ model: 'Post', where: args.where })
      return prisma.post.deleteMany(args)
    },
    updateManyPost: (_parent, args, ) => {
      return prisma.post.updateMany(args)
    },
  },
}
