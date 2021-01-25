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
    // Read types
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
    // Update types
    if (updateMany === info.fieldName) {
      const hasUpdateAccess = checkUserPermission("update", permissions);
      if (!hasUpdateAccess || hasUpdateAccess === "NONE") {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasUpdateAccess === "OWN") {
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
      } else if (hasUpdateAccess === "ALL") {
        return next();
      }
    }
    if (updateOne === info.fieldName) {
      const hasUpdateAccess = checkUserPermission("update", permissions);
      if (!hasUpdateAccess || hasUpdateAccess === "NONE") {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasUpdateAccess === "OWN") {
        if (context.moduleId !== "User") {
          args.select.authorId = true;
        }
        const item = await prisma[
          context.moduleId.charAt(0).toLowerCase() + context.moduleId.slice(1)
        ]
          .findUnique({
            where: args.where,
            rejectOnNotFound: true,
          })
          .catch((err) => {
            throw new Error(err);
          });
        if (
          (item && item.authorId === context.user.id) ||
          (context.moduleId === "User" && item && item.id === context.user.id)
        ) {
          return next();
        } else {
          throw new ApolloError("Forbidden!", "Forbidden");
        }
      } else if (hasUpdateAccess === "ALL") {
        return next();
      }
    }

    // Delete types
    if (deleteMany === info.fieldName) {
      const hasDeleteAccess = checkUserPermission("delete", permissions);
      if (!hasDeleteAccess || hasDeleteAccess === "NONE") {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasDeleteAccess === "OWN") {
        if (context.moduleId === "User")
          throw new ApolloError("Forbidden!", "Forbidden");
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
      } else if (hasDeleteAccess === "ALL") {
        return next();
      }
    }
    if (deleteOne === info.fieldName) {
      const hasDeleteAccess = checkUserPermission("delete", permissions);
      if (!hasDeleteAccess || hasDeleteAccess === "NONE") {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasDeleteAccess === "OWN") {
        if (context.moduleId === "User")
          throw new ApolloError("Forbidden!", "Forbidden");
        const item = await prisma[
          context.moduleId.charAt(0).toLowerCase() + context.moduleId.slice(1)
        ]
          .findUnique({
            where: args.where,
            rejectOnNotFound: true,
          })
          .catch((err) => {
            throw new Error(err);
          });
        if (
          (item && item.authorId === context.user.id) ||
          (context.moduleId === "User" && item && item.id === context.user.id)
        ) {
          return next();
        } else {
          throw new ApolloError("Forbidden!", "Forbidden");
        }
      } else if (hasDeleteAccess === "ALL") {
        return next();
      }
    }
  } else {
    return next();
  }
};
