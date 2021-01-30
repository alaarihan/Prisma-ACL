import { ApolloError } from "apollo-server-express";
import { hash } from "bcrypt";
import { dataModel, schema } from "../../../tools/schema";
import { prisma } from "../../common/prisma";

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

  // Auto fill author for all roles
  if ([createOne, updateOne, updateMany, upsertOne].includes(info.fieldName)) {
    args.data = doFieldAction(
      args.data,
      autoFillAuthor,
      ["create", "createOrConnect", "update", "updateMany", "upsert"],
      { moduleId, user }
    );
    args.data = await doFieldAction(
      args.data,
      autoHashPassword,
      ["create", "createOrConnect", "update", "updateMany", "upsert"],
      null
    );
  }

  /* Admin role */
  if (user.role === "ADMIN") {
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

  if ([createOne, updateOne, updateMany, upsertOne].includes(info.fieldName)) {
    args.data = doFieldAction(
      args.data,
      preventAlteringFields,
      ["create", "createOrConnect", "update", "updateMany", "upsert"],
      {
        subFields: [
          "id",
          "createdAt",
          "updatedAt",
          {
            fields: ["role", "password", "email"],
            modules: ["User"],
            byPass: { create: "YES", update: ["ALL"], and: false },
          },
        ],
        moduleId,
        user,
        allPermissions,
      }
    );
  }
  /* Create type */
  if (createOne === info.fieldName) {
    args.data = applyCreateAcl(args.data, user, moduleId, permissions);
    args.data = await applyRelationsMutationsAcl(
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
    args.data = await applyRelationsMutationsAcl(
      args.data,
      user,
      moduleId,
      allPermissions
    );
  }

  /*  Upsert type */
  if (upsertOne === info.fieldName) {
    args = await applyUpsertOneAcl(args, user, moduleId, permissions);
    args.create = await applyRelationsMutationsAcl(
      args.create,
      user,
      moduleId,
      allPermissions
    );
    args.update = await applyRelationsMutationsAcl(
      args.update,
      user,
      moduleId,
      allPermissions
    );
  }

  // Delete types
  if (deleteMany === info.fieldName) {
    args.where = applyDeleteManyAcl(args.where, user, moduleId, permissions);
  }
  if (deleteOne === info.fieldName) {
    await applyDeleteOneAcl(args, user, moduleId, permissions);
  }
  
  /* Get the results */
  let results = await next();

  /* Apply read own ACL */
  if (uniqueReadType === info.fieldName) {
    results = applyUniqueReadOwnAcl(user, results);
  }
  results = applyObjectRelationsAcl(user, moduleId, allPermissions, results);

  /* Return the final results */
  return results;
}

function applyCreateAcl(args, user, moduleId, permissions) {
  const hasCreateAccess = checkUserPermission("create", permissions);
  if (!hasCreateAccess || hasCreateAccess === "NO") {
    throw new ApolloError("Forbidden!", "Forbidden");
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
  if (!hasUpdateAccess || hasUpdateAccess === "NONE") {
    throw new ApolloError("Forbidden!", "Forbidden");
  } else if (hasUpdateAccess === "OWN") {
    // Prevent updating own user data using updateMany mutation
    if (moduleId === "User") {
      throw new ApolloError("Forbidden!", "Forbidden");
    }
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
  if (!hasUpdateAccess || hasUpdateAccess === "NONE") {
    throw new ApolloError("Forbidden!", "Forbidden");
  } else if (hasUpdateAccess === "OWN") {
    // Prevent user from changing his email or password directly
    if (moduleId === "User") {
      if (args.data.password) {
        throw new ApolloError(
          "Forbidden!, You can't directly change your password",
          "Forbidden"
        );
      }
      if (args.data.email) {
        throw new ApolloError(
          "Forbidden!, You can't directly change your email",
          "Forbidden"
        );
      }
    }
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
  if (
    !hasUpdateAccess ||
    hasUpdateAccess === "NONE" ||
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
      (item?.authorId && item.authorId !== user.id) ||
      (moduleId === "User" && item && item.id !== user.id)
    ) {
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
    if (!args) {
      args = {};
    }
    if (!args.AND) {
      args.AND = [];
    }
    if (!args.AND[1]) {
      args.AND[1] = {};
    }
    if (!args.AND[1].authorId) {
      args.AND[1].authorId = {};
    }
    args.AND[1].authorId.equals = user.id;
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
    if (value && typeof value === "object") {
      const relationField = getRelationField(moduleId, key);
      if (!relationField) continue;
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
  if (!data || moduleId === "User") return data;
  if (!Array.isArray(data)) {
    data = applyOneObjectRelationsAcl(user, moduleId, allPermissions, data);
  } else {
    for (let index = 0; index < data.length; index++) {
      data[index] = applyOneObjectRelationsAcl(
        user,
        moduleId,
        allPermissions,
        data[index]
      );
    }
  }
  return data;
}

function applyOneObjectRelationsAcl(user, moduleId, allPermissions, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object") {
      const relationField = getRelationField(moduleId, key);
      if (relationField?.kind !== "object") continue;
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
      if (data[key] && typeof data[key] === "object")
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
    const relationField = getRelationField(moduleId, key);
    if (relationField?.kind === "object") {
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
    const relationField = getRelationField(moduleId, key);
    if (relationField?.kind === "object") {
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

async function applyRelationsMutationsAcl(
  args,
  user,
  moduleId,
  allPermissions
) {
  for (const [key, value] of Object.entries(args)) {
    if (value && typeof value === "object") {
      const relationField = getRelationField(moduleId, key);
      if (relationField?.kind !== "object") continue;
      const permissions = allPermissions.find(
        (item) => item.type === relationField.type
      );
      if (!permissions) throw new Error("Error in ACL!");
      if (args[key].create) {
        for (let index = 0; index < args[key].create.length; index++) {
          args[key].create[index] = applyCreateAcl(
            args[key].create[index],
            user,
            relationField.type,
            permissions
          );
          args[key].create[index] = await applyRelationsMutationsAcl(
            args[key].create[index],
            user,
            relationField.type,
            allPermissions
          );
        }
      }
      if (args[key].connectOrCreate) {
        for (let index = 0; index < args[key].connectOrCreate.length; index++) {
          if (args[key].connectOrCreate[index].create) {
            args[key].connectOrCreate[index].create = applyCreateAcl(
              args[key].connectOrCreate[index].create,
              user,
              relationField.type,
              permissions
            );
            args[key].connectOrCreate[
              index
            ].create = await applyRelationsMutationsAcl(
              args[key].connectOrCreate[index].create,
              user,
              relationField.type,
              allPermissions
            );
          }
        }
      }
      if (args[key].delete) {
        for (let index = 0; index < args[key].delete.length; index++) {
          await applyDeleteOneAcl(
            { where: args[key].delete[index] },
            user,
            relationField.type,
            permissions
          );
        }
      }
      if (args[key].deleteMany) {
        for (let index = 0; index < args[key].deleteMany.length; index++) {
          args[key].deleteMany[index] = applyDeleteManyAcl(
            args[key].deleteMany[index],
            user,
            relationField.type,
            permissions
          );
        }
      }
      if (args[key].updateMany) {
        for (let index = 0; index < args[key].updateMany.length; index++) {
          args[key].updateMany[index] = applyUpdateManyAcl(
            args[key].updateMany[index],
            user,
            relationField.type,
            permissions
          );
        }
      }
      if (args[key].update) {
        for (let index = 0; index < args[key].update.length; index++) {
          await applyUpdateOneAcl(
            args[key].update[index],
            user,
            relationField.type,
            permissions
          );
          args[key].update[index] = await applyRelationsMutationsAcl(
            args[key].update[index],
            user,
            relationField.type,
            allPermissions
          );
        }
      }
      if (args[key].upsert) {
        for (let index = 0; index < args[key].upsert.length; index++) {
          args[key].upsert[index] = await applyUpsertOneAcl(
            args[key].upsert[index],
            user,
            relationField.type,
            permissions
          );
          args[key].upsert[index].create = await applyRelationsMutationsAcl(
            args[key].upsert[index].create,
            user,
            relationField.type,
            allPermissions
          );
          args[key].upsert[index].update = await applyRelationsMutationsAcl(
            args[key].upsert[index].update,
            user,
            relationField.type,
            allPermissions
          );
        }
      }
    }
  }
  return args;
}

function getRelationField(moduleId, name) {
  const prismaModel = dataModel.models.find((item) => item.name === moduleId);
  if (!prismaModel) return;
  const relationField = prismaModel.fields.find((item) => item.name === name);
  return relationField;
}

function doFieldAction(data, action, fields, args, times = 0) {
  if (times === 0) {
    data = action(data, fields, args);
  }
  times++;
  if (Array.isArray(data)) {
    for (let index = 0; index < data.length; index++) {
      data[index] = doFieldActionObject(
        data[index],
        action,
        fields,
        args,
        times
      );
    }
  } else if (typeof data === "object") {
    data = doFieldActionObject(data, action, fields, args, times);
  }
  return data;
}

function doFieldActionObject(data, action, fields, args, times) {
  for (const [key, value] of Object.entries(data)) {
    if (args.moduleId && typeof value === "object") {
      const relationField = getRelationField(args.moduleId, key);
      if (relationField?.type) {
        args.moduleId = relationField.type;
      }
    }
    if (fields === null || fields.includes(key)) {
      data[key] = action(data[key], fields, args);
    }
    if (data[key] && typeof data[key] === "object") {
      data[key] = doFieldAction(data[key], action, fields, args, times);
    }
  }
  return data;
}

function preventAlteringFields(data, fields, args) {
  if (args.user?.role === "ADMIN") return data;
  if (typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (args.subFields) {
        args.subFields.forEach((subField) => {
          if (subField === key) {
            throw new ApolloError(`You can't manually set '${key}' field`);
          } else if (
            typeof subField === "object" &&
            subField.fields.includes(key) &&
            subField.modules.includes(args.moduleId)
          ) {
            if (subField.byPass) {
              const permissions = args.allPermissions.find(
                (item) => item.type === args.moduleId
              );
              if (!permissions) throw new Error("Error in ACL!");
              let allAclOk = true;
              let someAclOk = false;
              if (subField.byPass.create) {
                const createAccess = checkUserPermission("create", permissions);
                if (createAccess === subField.byPass.create) {
                  someAclOk = true;
                } else {
                  allAclOk = false;
                }
              }
              if (subField.byPass.update) {
                const updateAccess = checkUserPermission("update", permissions);
                if (subField.byPass.update.includes(updateAccess)) {
                  someAclOk = true;
                } else {
                  allAclOk = false;
                }
              }
              if (
                (subField.byPass.and && !allAclOk) ||
                (!subField.byPass.and && !someAclOk)
              ) {
                throw new ApolloError(`You can't manually set '${key}' field`);
              }
            } else {
              throw new ApolloError(`You can't manually set '${key}' field`);
            }
          }
        });
      }
    }
  }
  return data;
}

function autoFillAuthor(data, fields, { moduleId, user }) {
  if (typeof data === "object" && !noAuthorTypes.includes(moduleId)) {
    if (user.role !== "ADMIN" && (data.author || data.authorId)) {
      throw new ApolloError("You can't manually set author!", "Forbidden");
    } else {
      data.authorId = user.id;
    }
  }
  return data;
}

async function autoHashPassword(data, fields) {
  if (typeof data === "object" && data.password) {
    data.password = await hash(data.password, 10);
  }
  return data;
}
