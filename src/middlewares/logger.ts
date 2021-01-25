import { prisma } from "../common/prisma";

export const logger = async ({ parent, context, info }, next) => {
  const logTypes = ["Query", "Mutation"];
  if (logTypes.includes(info.path.typename)) {
    await prisma.log
      .create({
        data: {
          operation: info.fieldName,
          ip: context.req.connection.remoteAddress.replace("::ffff:", ""),
          host: context.req.headers.host,
          userAgent: context.req.headers["user-agent"],
          referer: context.req.headers.referer,
        },
      })
      .catch((err) => console.log(err));
  }
  return next();
};
