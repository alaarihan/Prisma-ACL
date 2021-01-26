import { ApolloError } from "apollo-server-express";
import { prisma } from "../common/prisma";

function checkUserPermission(permission, permissions) {
  const hasAccess = permissions[permission];
  if (hasAccess === "NONE") {
    return "NONE";
  } else if (hasAccess === "ALL") {
    return "ALL";
  } else if (hasAccess === "OWN") {
    return "OWN";
  } else if (hasAccess === true) {
    return "YES";
  } else {
    return "NO";
  }
}

export const acl = async ({ parent, args, context, info }, next) => {
  const aclTypes = ["Query", "Mutation"];
  if (context.moduleId === "Auth") return next();
  const operationModel =
    context.moduleId.charAt(0).toLowerCase() + context.moduleId.slice(1);
  const noAuthorTypes = ["User", "RoleAccess", "Category"];
  const createOne = `createOne${context.moduleId}`;
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
    /* Admin role */
    if (context.user.role === "ADMIN") {
      if (noAuthorTypes.includes(context.moduleId)) return next();
      // Auto populate the author if not manually populated by admin
      if (
        createOne === info.fieldName &&
        !args.data.authorId &&
        !args.data.author
      ) {
        args.data.authorId = context.user.id;
      } else if (
        upsertOne === info.fieldName &&
        !args.create.authorId &&
        !args.create.author
      ) {
        args.create.authorId = context.user.id;
      }
      return next();
    }
    /* Other roles */
    const permissions = await prisma.roleAccess
      .findUnique({
        where: {
          role_type: { role: context.user.role, type: context.moduleId },
        },
      })
      .catch((err) => {
        throw err;
      });
    if (!permissions || !permissions.id) throw new Error("ACL problem!");
    /* Create type */
    if (createOne === info.fieldName) {
      const hasCreateAccess = checkUserPermission("create", permissions);
      if (!hasCreateAccess || hasCreateAccess === "NO") {
        throw new ApolloError("Forbidden!", "Forbidden");
      }
      if (hasCreateAccess && hasCreateAccess !== "NONE") {
        if (!noAuthorTypes.includes(context.moduleId)) {
          if (args.data.author || args.data.authorId) {
            throw new ApolloError(
              "You can't manually set author!",
              "Forbidden"
            );
          }
        }
      }
       // Auto populate the author
      if (!noAuthorTypes.includes(context.moduleId)) {
        args.data.authorId = context.user.id;
      }
      return next();
    }
    /* Read types */
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
    /* Update types */
    if (updateMany === info.fieldName) {
      const hasUpdateAccess = checkUserPermission("update", permissions);
      // Prevent roles other than admin from updating author field
      if (hasUpdateAccess && hasUpdateAccess !== "NONE") {
        if (!noAuthorTypes.includes(context.moduleId)) {
          if (args.data.author || args.data.authorId) {
            throw new ApolloError("You can't update author!", "Forbidden");
          }
        }
      }
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
      // Prevent roles other than admin from updating author field
      if (hasUpdateAccess && hasUpdateAccess !== "NONE") {
        if (!noAuthorTypes.includes(context.moduleId)) {
          if (args.data.author || args.data.authorId) {
            throw new ApolloError("You can't update author!", "Forbidden");
          }
        }
      }
      if (!hasUpdateAccess || hasUpdateAccess === "NONE") {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasUpdateAccess === "OWN") {
        const item = await prisma[operationModel]
          .findUnique({
            where: args.where,
            rejectOnNotFound: true,
          })
          .catch((err) => {
            throw err;
          });
        if (
          (item && item.authorId && item.authorId === context.user.id) ||
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

   /*  Upsert type */
    if (upsertOne === info.fieldName) {
      const hasUpdateAccess = checkUserPermission("update", permissions);
      const hasCreateAccess = checkUserPermission("create", permissions);
      if (hasCreateAccess === "YES") {
        if (!noAuthorTypes.includes(context.moduleId)) {
          if (args.create.author || args.create.authorId) {
            throw new ApolloError(
              "You can't manually set author!",
              "Forbidden"
            );
          }
          // Auto populate the author
          args.create.authorId = context.user.id;
        }
      // Prevent roles other than admin from updating author field
      } else if (hasUpdateAccess && hasUpdateAccess !== "NONE") {
        if (!noAuthorTypes.includes(context.moduleId)) {
          if (args.update.author || args.update.authorId) {
            throw new ApolloError("You can't update author!", "Forbidden");
          }
        }
      }
      if (
        !hasUpdateAccess ||
        hasUpdateAccess === "NONE" ||
        !hasCreateAccess ||
        hasCreateAccess !== "YES"
      ) {
        throw new ApolloError("Forbidden!", "Forbidden");
      } else if (hasUpdateAccess === "OWN") {
        const item = await prisma[operationModel]
          .findUnique({
            where: args.where,
            rejectOnNotFound: false,
          })
          .catch((err) => {
            throw err;
          });
        if (
          (item && item.authorId && item.authorId === context.user.id) ||
          (context.moduleId === "User" && item && item.id === context.user.id)
        ) {
          return next();
        } else {
          throw new ApolloError("Forbidden!", "Forbidden");
        }
      } else if (hasUpdateAccess === "ALL" && hasCreateAccess === "YES") {
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
        const item = await prisma[operationModel]
          .findUnique({
            where: args.where,
            rejectOnNotFound: true,
          })
          .catch((err) => {
            throw err;
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
