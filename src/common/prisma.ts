import { PrismaClient, Prisma as PrismaTypes } from '@prisma/client'
import { PrismaDelete, onDeleteArgs } from '@paljs/plugins'

export class Prisma extends PrismaClient {
  constructor(options?: PrismaTypes.PrismaClientOptions) {
    super(options)
  }

  async onDelete(args: onDeleteArgs) {
    const prismaDelete = new PrismaDelete(this)
    await prismaDelete.onDelete(args)
  }
}

export const prisma = new Prisma()