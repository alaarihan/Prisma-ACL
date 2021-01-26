import { ApolloError } from "apollo-server-express";
import { dataModel } from "../../tools/schema";
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

  if (aclTypes.includes(info.path.typename)) {
    return checkAcl(args, info, context.user, context.moduleId, next);
  } else {
    return next();
  }
};

async function checkAcl(args, info, user, moduleId, next) {
  const operationModel = moduleId.charAt(0).toLowerCase() + moduleId.slice(1);
  const noAuthorTypes = ["User", "RoleAccess", "Category"];
  const createOne = `createOne${moduleId}`;
  const uniqueReadType = `findUnique${moduleId}`;
  const readTypes = [
    `findFirst${moduleId}`,
    `findMany${moduleId}`,
    `findMany${moduleId}Count`,
    `aggregate${moduleId}`,
  ];
  const updateOne = `updateOne${moduleId}`;
  const updateMany = `updateMany${moduleId}`;
  const deleteOne = `deleteOne${moduleId}`;
  const deleteMany = `deleteMany${moduleId}`;
  const upsertOne = `upsertOne${moduleId}`;
  /* Admin role */
  if (user.role === "ADMIN") {
    if (noAuthorTypes.includes(moduleId)) return next();
    // Auto populate the author if not manually populated by admin
    if (
      createOne === info.fieldName &&
      !args.data.authorId &&
      !args.data.author
    ) {
      args.data.authorId = user.id;
    } else if (
      upsertOne === info.fieldName &&
      !args.create.authorId &&
      !args.create.author
    ) {
      args.create.authorId = user.id;
    }
    return next();
  }
  /* restrict relational selected fields */
  args.select = await applySelectRelationsAcl(args, user, moduleId);

  /* Other roles */
  const permissions = await prisma.roleAccess
    .findUnique({
      where: {
        role_type: { role: user.role, type: moduleId },
      },
      rejectOnNotFound: true,
    })
    .catch((err) => {
      throw err;
    });
  /* Create type */
  if (createOne === info.fieldName) {
    const hasCreateAccess = checkUserPermission("create", permissions);
    if (!hasCreateAccess || hasCreateAccess === "NO") {
      throw new ApolloError("Forbidden!", "Forbidden");
    }
    if (hasCreateAccess && hasCreateAccess !== "NONE") {
      if (!noAuthorTypes.includes(moduleId)) {
        if (args.data.author || args.data.authorId) {
          throw new ApolloError("You can't manually set author!", "Forbidden");
        }
      }
    }
    // Auto populate the author
    if (!noAuthorTypes.includes(moduleId)) {
      args.data.authorId = user.id;
    }
    return next();
  }
  /* Read types */
  if (readTypes.includes(info.fieldName)) {
    const hasReadAccess = checkUserPermission("read", permissions);
    if (hasReadAccess === "OWN" && moduleId === "User") {
      throw new ApolloError("Forbidden!", "Forbidden");
    }
    args = applyReadAcl(args, user, hasReadAccess);
    return next();
  }
  if (uniqueReadType === info.fieldName) {
    const hasReadAccess = checkUserPermission("read", permissions);
    if (!hasReadAccess || hasReadAccess === "NONE") {
      throw new ApolloError("Forbidden!", "Forbidden");
    } else if (hasReadAccess === "OWN") {
      args.select.authorId = true;
      const item = await next();
      if (item && item.authorId === user.id) {
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
      if (!noAuthorTypes.includes(moduleId)) {
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
      args.where.AND[1].authorId.equals = user.id;
      return next();
    } else if (hasUpdateAccess === "ALL") {
      return next();
    }
  }
  if (updateOne === info.fieldName) {
    const hasUpdateAccess = checkUserPermission("update", permissions);
    // Prevent roles other than admin from updating author field
    if (hasUpdateAccess && hasUpdateAccess !== "NONE") {
      if (!noAuthorTypes.includes(moduleId)) {
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
        (item && item.authorId && item.authorId === user.id) ||
        (moduleId === "User" && item && item.id === user.id)
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
      if (!noAuthorTypes.includes(moduleId)) {
        if (args.create.author || args.create.authorId) {
          throw new ApolloError("You can't manually set author!", "Forbidden");
        }
        // Auto populate the author
        args.create.authorId = user.id;
      }
      // Prevent roles other than admin from updating author field
    } else if (hasUpdateAccess && hasUpdateAccess !== "NONE") {
      if (!noAuthorTypes.includes(moduleId)) {
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
        (item && item.authorId && item.authorId === user.id) ||
        (moduleId === "User" && item && item.id === user.id)
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
      if (moduleId === "User") throw new ApolloError("Forbidden!", "Forbidden");
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
      args.where.AND[1].authorId.equals = user.id;
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
      if (moduleId === "User") throw new ApolloError("Forbidden!", "Forbidden");
      const item = await prisma[operationModel]
        .findUnique({
          where: args.where,
          rejectOnNotFound: true,
        })
        .catch((err) => {
          throw err;
        });
      if (
        (item && item.authorId === user.id) ||
        (moduleId === "User" && item && item.id === user.id)
      ) {
        return next();
      } else {
        throw new ApolloError("Forbidden!", "Forbidden");
      }
    } else if (hasDeleteAccess === "ALL") {
      return next();
    }
  }
}
function applyReadAcl(args, user, hasReadAccess) {
  if (hasReadAccess === "OWN") {
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
    args.where.AND[1].authorId.equals = user.id;
    return args;
  } else if (hasReadAccess === "ALL") {
    return args;
  } else {
    throw new ApolloError("Forbidden!", "Forbidden");
  }
}

async function applySelectRelationsAcl(args, user, moduleId) {
  for (const [key, value] of Object.entries(args.select)) {
    if (typeof value === "object") {
      const prismaModel = dataModel.models.find(
        (item) => item.name === moduleId
      );
      if (!prismaModel || !prismaModel.fields) return;
      const relationField = prismaModel.fields.find(
        (item) => item.name === key
      );
      if (!relationField) return;
      const permissions = await prisma.roleAccess
        .findUnique({
          where: {
            role_type: { role: user.role, type: relationField.type },
          },
          rejectOnNotFound: true,
        })
        .catch((err) => {
          throw err;
        });
      const hasReadAccess = checkUserPermission("read", permissions);
      if (relationField.isList) {
        args.select[key] = applyReadAcl(args.select[key], user, hasReadAccess);
      }
      args.select[key].select = await applySelectRelationsAcl(
        args.select[key],
        user,
        relationField.type
      );
    }
  }
  return args.select;
}
