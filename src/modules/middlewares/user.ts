import { hash } from "bcrypt";

export const userMiddleware = async ({ args, context, info }, next) => {
  const types = ["Query", "Mutation"];
  const byPassList = ["deleteOneUser", "deleteManyUser"];
  if (
    types.includes(info.path.typename) &&
    !byPassList.includes(info.fieldName)
  ) {
    if (
      info.fieldName === "createOneUser" ||
      info.fieldName === "updateOneUser" ||
      info.fieldName === "updateManyUser"
    ) {
      if (args.data.password) {
        args.data.password = await hash(args.data.password, 10);
      }
    } else if (info.fieldName === "upsertOneUser") {
      if (args.update && args.update.password) {
        args.update.password = await hash(args.update.password, 10);
      }
      if (args.create && args.create.password) {
        args.create.password = await hash(args.create.password, 10);
      }
    }
  }
  return next();
};
