import { verify } from "jsonwebtoken";
import { FastifyRequest } from 'fastify/types/request';
import { prisma, Prisma } from './common/prisma'

export interface Context {
  req: FastifyRequest
  user: any
  prisma: Prisma
  select: any
}

export async function createContext(req: FastifyRequest): Promise<Context> {
  if (req.body?.operationName === "IntrospectionQuery") return;
    let authScope = "";
    let user;
    if (req.headers && req.headers.authorization) {
      authScope = req.headers.authorization;
    }
    const token = authScope.replace("Bearer ", "");
    if (token.length) {
      const { userId } = verify(token, process.env.APP_SECRET);
      if (userId) {
        user = await prisma.user
          .findUnique({
            where: { id: userId },
            rejectOnNotFound: true,
            select: {
              id: true,
              email: true,
              country: true,
              dandaraCenter: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          })
          .catch((err) => {
            throw err;
          });
      }
    }
  return {
    req,
    user,
    prisma,
    select: {},
  }
}
