import { PrismaClient } from "@prisma/client";
import { PrismaDelete, onDeleteArgs } from "@paljs/plugins";

class PrismaProvider extends PrismaClient {
  async onDelete(args: onDeleteArgs) {
    const prismaDelete = new PrismaDelete(this);
    await prismaDelete.onDelete(args);
  }
}

export const prisma = new PrismaProvider();
