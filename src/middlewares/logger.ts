export const logger = async ({ parent, context, info }, next) => {
    const logTypes = ['Query', 'Mutation']
    if (logTypes.includes(info.path.typename)) {
      const log = await context.prisma.log.create({
        data: {
          operation: info.fieldName,
          ip: context.req.connection.remoteAddress.replace('::ffff:',''),
          host: context.req.headers.host,
          userAgent: context.req.headers["user-agent"],
          referer: context.req.headers.referer
        }
      })
    }
    return next();
  };
  