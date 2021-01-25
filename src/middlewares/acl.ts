import { ApolloError } from "apollo-server-express";
import { prisma } from "../common/prisma";

function checkUserPermission(permission, permissions) {
  const hasAccess = permissions[permission];
  if (!hasAccess || hasAccess === "NONE") {
    return "NONE";
  } else if (hasAccess === true || hasAccess === "ALL") {
    return "ALL";
  } else if (hasAccess === "OWN") {
    return "OWN";
  }
}

export const acl = async ({ parent, args, context, info }, next) => {
  const aclTypes = ["Query", "Mutation"];
  if (context.moduleId === "Auth") return next();
  const uniqueReadType = `findUnique${context.moduleId}`;
  const readTypes = [
    `findFirst${context.moduleId}`,
    `findMany${context.moduleId}`,
    `findMany${context.moduleId}Count`,
    `aggregate${context.moduleId}`,
  ];
  const updateOne = `updateOne${context.moduleId}`;
  const updateMany = `updateMany${context.moduleId}`;
  const deleteOne = `deleteOne${context.moduleId}`;
  const deleteMany = `deleteMany${context.moduleId}`;
  const upsertOne = `upsertOne${context.moduleId}`;
  if (aclTypes.includes(info.path.typename)) {
    if (context.user.role === "ADMIN") return next();
    const permissions = await prisma.roleAccess
      .findUnique({
        where: {
          role_type: { role: context.user.role, type: context.moduleId },
        },
      })
      .catch((err) => {
        throw new Error(err.message);
      });
    if (!permissions || !permissions.id) throw new Error("ACL problem!");
    if (readTypes.includes(info.fieldName)) {
      const hasReadAccess = checkUserPermission("read", permissions);
      if (!hasReadAccess || hasReadAccess === "NONE") {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasReadAccess === "OWN") {
        if (context.moduleId === "User") {
          throw new ApolloError("Forbidden!", "Forbidden");
        } else {
          if (!args.where) {
            args.where = {};
          }
          if (!args.where.AND) {
            args.where.AND = [];
          }
          if (!args.where.AND[1]) {
            args.where.AND[1] = {};
          }
          if (!args.where.AND[1].authorId) {
            args.where.AND[1].authorId = {};
          }
          args.where.AND[1].authorId.equals = context.user.id;
          return next();
        }
      } else if (hasReadAccess === "ALL") {
        return next();
      }
    }
    if (uniqueReadType === info.fieldName) {
      const hasReadAccess = checkUserPermission("read", permissions);
      if (!hasReadAccess || hasReadAccess === "NONE") {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasReadAccess === "OWN") {
        args.select.authorId = true;
        const item = await next();
        if (item && item.authorId === context.user.id) {
          return item;
        } else {
          return null;
        }
      } else if (hasReadAccess === "ALL") {
        return next();
      }
    }
  } else {
    return next();
  }
};
