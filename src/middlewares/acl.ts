import { ApolloError } from "apollo-server-express";
import { dataModel, schema } from "../../tools/schema";
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
const noAuthorTypes = ["User", "RoleAccess", "Category"];
async function checkAcl(args, info, user, moduleId, next) {
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

  /* Other roles */
  let dataModels = [];
  const selectedModels = getNestedSelectedModels(moduleId, args.select);
  dataModels = getNestedDataModels(moduleId, args.data);
  const queryTypes = [
    moduleId,
    ...selectedModels.map((item) => item.type),
    ...dataModels.map((item) => item.type),
  ];
  const allPermissions = await getUserPermissionsForTypes(
    queryTypes,
    user.role
  );
  const permissions = allPermissions.find((item) => item.type === moduleId);
  if (!permissions) throw new Error("Error in ACL!");
  /* Create type */
  if (createOne === info.fieldName) {
    args.data = applyCreateAcl(args.data, user, moduleId, permissions);
    args.data = applyCreateOneRelationsAcl(
      args.data,
      user,
      moduleId,
      allPermissions
    );
  }
  /* Read types */
  if (readTypes.includes(info.fieldName)) {
    args = applyReadAcl(args, user, moduleId, permissions);
    /* restrict relational selected fields */
    args.select = applySelectArrayRelationsAcl(
      args,
      user,
      moduleId,
      allPermissions
    );
  }
  if (uniqueReadType === info.fieldName) {
    args = applyUniqueReadAcl(args, permissions);
    /* restrict relational selected fields */
    args.select = applySelectArrayRelationsAcl(
      args,
      user,
      moduleId,
      allPermissions
    );
  }
  /* Update types */
  if (updateMany === info.fieldName) {
    args = applyUpdateManyAcl(args, user, moduleId, permissions);
  }
  if (updateOne === info.fieldName) {
    await applyUpdateOneAcl(args, user, moduleId, permissions);
  }

  /*  Upsert type */
  if (upsertOne === info.fieldName) {
    args = await applyUpsertOneAcl(args, user, moduleId, permissions);
  }

  // Delete types
  if (deleteMany === info.fieldName) {
    args = applyDeleteManyAcl(args, user, moduleId, permissions);
  }
  if (deleteOne === info.fieldName) {
    await applyDeleteOneAcl(args, user, moduleId, permissions);
  }
  let results = await next();
  if (uniqueReadType === info.fieldName) {
    results = applyUniqueReadOwnAcl(user, results);
  }
  results = applyObjectRelationsAcl(user, moduleId, allPermissions, results);
  return results;
}

function applyCreateAcl(args, user, moduleId, permissions) {
  const hasCreateAccess = checkUserPermission("create", permissions);
  if (!hasCreateAccess || hasCreateAccess === "NO") {
    throw new ApolloError("Forbidden!", "Forbidden");
  }
  if (hasCreateAccess === "YES") {
    // Prevent manually populating the author
    if (!noAuthorTypes.includes(moduleId)) {
      if (Array.isArray(args)) {
        args.forEach((item) => {
          if (item.author || item.authorId) {
            throw new ApolloError(
              "You can't manually set author!",
              "Forbidden"
            );
          }
        });
      } else if (args.author || args.authorId) {
        throw new ApolloError("You can't manually set author!", "Forbidden");
      }
    }
  }
  // Auto populate the author
  if (!noAuthorTypes.includes(moduleId)) {
    if (Array.isArray(args)) {
      args = args.map((item) => {
        item.authorId = user.id;
        return item;
      });
    } else {
      args.authorId = user.id;
    }
  }
  return args;
}
function applyReadAcl(args, user, moduleId, permissions) {
  const hasReadAccess = checkUserPermission("read", permissions);
  if (hasReadAccess === "OWN" && moduleId === "User") {
    throw new ApolloError("Forbidden!", "Forbidden");
  }
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

function applyUniqueReadAcl(args, permissions) {
  const hasReadAccess = checkUserPermission("read", permissions);
  if (!hasReadAccess || hasReadAccess === "NONE") {
    throw new ApolloError("Forbidden!", "Forbidden");
  } else if (hasReadAccess === "OWN") {
    args.select.authorId = true;
  }
  return args;
}

function applyUpdateManyAcl(args, user, moduleId, permissions) {
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
  }
  return args;
}

async function applyUpdateOneAcl(args, user, moduleId, permissions) {
  const operationModel = moduleId.charAt(0).toLowerCase() + moduleId.slice(1);
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
    } else {
      throw new ApolloError("Forbidden!", "Forbidden");
    }
  }
}

async function applyUpsertOneAcl(args, user, moduleId, permissions) {
  const operationModel = moduleId.charAt(0).toLowerCase() + moduleId.slice(1);
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
    } else {
      throw new ApolloError("Forbidden!", "Forbidden");
    }
  }
  return args;
}

function applyDeleteManyAcl(args, user, moduleId, permissions) {
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
  }
  return args;
}

async function applyDeleteOneAcl(args, user, moduleId, permissions) {
  const operationModel = moduleId.charAt(0).toLowerCase() + moduleId.slice(1);
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
    } else {
      throw new ApolloError("Forbidden!", "Forbidden");
    }
  }
}

function applyUniqueReadOwnAcl(user, item) {
  if (item && item.authorId === user.id) {
    return item;
  } else {
    return null;
  }
}

function applySelectArrayRelationsAcl(args, user, moduleId, allPermissions) {
  for (const [key, value] of Object.entries(args.select)) {
    if (typeof value === "object") {
      const prismaModel = dataModel.models.find(
        (item) => item.name === moduleId
      );
      const relationField = prismaModel.fields.find(
        (item) => item.name === key
      );
      const permissions = allPermissions.find(
        (item) => item.type === relationField.type
      );
      if (!permissions) throw new Error("Error in ACL!");
      if (relationField.isList) {
        args.select[key] = applyReadAcl(
          args.select[key],
          user,
          moduleId,
          permissions
        );
      } else if (!noAuthorTypes.includes(relationField.type)) {
        args.select[key].select.authorId = true;
      }
      args.select[key].select = applySelectArrayRelationsAcl(
        args.select[key],
        user,
        relationField.type,
        allPermissions
      );
    }
  }
  return args.select;
}

function applyObjectRelationsAcl(user, moduleId, allPermissions, data) {
  if (data && !Array.isArray(data))
    data = applyOneObjectRelationsAcl(user, moduleId, allPermissions, data);
  else
    for (let index = 0; index < data.length; index++) {
      data[index] = applyOneObjectRelationsAcl(
        user,
        moduleId,
        allPermissions,
        data[index]
      );
    }
  return data;
}

function applyOneObjectRelationsAcl(user, moduleId, allPermissions, data) {
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object") {
      const prismaModel = dataModel.models.find(
        (item) => item.name === moduleId
      );
      const relationField = prismaModel.fields.find(
        (item) => item.name === key
      );
      const permissions = allPermissions.find(
        (item) => item.type === relationField.type
      );
      if (!permissions) throw new Error("Error in ACL!");
      const hasReadAccess = checkUserPermission("read", permissions);
      if (hasReadAccess === "OWN" && moduleId === "User") {
        throw new ApolloError("Forbidden!", "Forbidden");
      }
      if (!relationField.isList) {
        if (hasReadAccess === "ALL") continue;
        else if (
          hasReadAccess === "OWN" &&
          data[key].authorId &&
          data[key].authorId !== user.id
        ) {
          data[key] = null;
        } else {
          throw new ApolloError("Forbidden!", "Forbidden");
        }
      }
      if (typeof data[key] === "object")
        data[key] = applyObjectRelationsAcl(
          user,
          relationField.type,
          allPermissions,
          data[key]
        );
    }
  }
  return data;
}

function getNestedSelectedModels(moduleId, select, models = []) {
  for (const [key, value] of Object.entries(select)) {
    const prismaModel = dataModel.models.find((item) => item.name === moduleId);
    const relationField = prismaModel.fields.find((item) => item.name === key);
    if (relationField && relationField.kind === "object") {
      if (!models.find((item) => item.type === relationField.type))
        models.push(relationField);
      models = getNestedSelectedModels(
        relationField.type,
        select[key].select,
        models
      );
    }
  }
  return models;
}

function getNestedDataModels(moduleId, data, models = []) {
  if (Array.isArray(data)) {
    for (let index = 0; index < data.length; index++) {
      models = getOneNestedDataModels(moduleId, data[index], models);
    }
  } else {
    models = getOneNestedDataModels(moduleId, data, models);
  }

  return models;
}

function getOneNestedDataModels(moduleId, data, models) {
  for (const [key, value] of Object.entries(data)) {
    const prismaModel = dataModel.models.find((item) => item.name === moduleId);
    if (!prismaModel) continue;
    const relationField = prismaModel.fields.find((item) => item.name === key);
    if (!relationField) continue;
    if (relationField && relationField.kind === "object") {
      if (!models.find((item) => item.type === relationField.type))
        models.push(relationField);
      models = getNestedDataModels(relationField.type, data[key], models);
    }
  }
  return models;
}

async function getUserPermissionsForTypes(types, userRole) {
  const permissions = await prisma.roleAccess
    .findMany({
      where: {
        role: { equals: userRole },
        type: { in: types },
      },
    })
    .catch((err) => {
      throw err;
    });
  return permissions;
}

function applyCreateOneRelationsAcl(args, user, moduleId, allPermissions) {
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "object") {
      const prismaModel = dataModel.models.find(
        (item) => item.name === moduleId
      );
      if (!prismaModel) continue;

      const relationField = prismaModel.fields.find(
        (item) => item.name === key
      );
      if (!relationField) continue;
      const permissions = allPermissions.find(
        (item) => item.type === relationField.type
      );
      if (!permissions) throw new Error("Error in ACL!");
      if (args[key].create) {
        args[key].create = applyCreateAcl(
          args[key].create,
          user,
          relationField.type,
          permissions
        );
        args[key].create = applyCreateOneRelationsAcl(
          args[key].create,
          user,
          relationField.type,
          allPermissions
        );
      }
      if (args[key].connectOrCreate?.create) {
        args[key].connectOrCreate.create = applyCreateAcl(
          args[key].connectOrCreate.create,
          user,
          relationField.type,
          permissions
        );
        args[key].connectOrCreate.create = applyCreateOneRelationsAcl(
          args[key].connectOrCreate.create,
          user,
          relationField.type,
          allPermissions
        );
      }
    }
  }
  return args;
}
