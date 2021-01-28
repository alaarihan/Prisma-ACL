import { prisma } from "../../common/prisma";

export const logger = async ({ parent, context, info }, next) => {
  const logTypes = ["Query", "Mutation"];
  if (logTypes.includes(info.path.typename)) {
    const log = {
      operation: info.fieldName,
      ip: context.req.connection.remoteAddress.replace("::ffff:", ""),
      host: context.req.headers.host,
      userAgent: context.req.headers["user-agent"],
      referer: context.req.headers.referer,
      authorId: null,
    };
    if (context.user && context.user.id) {
      log.authorId = context.user.id;
    }
    await prisma.log
      .create({
        data: log,
      })
      .catch((err) => console.log(err));
  }
  return next();
};
