export const jwtAuth = async ({ parent, context, info }, next) => {
    const types = ['Query', 'Mutation']
    const byPassList = ['login', 'signup']
    if (types.includes(info.path.typename) && !byPassList.includes(info.fieldName)) {
      if(!context.user){
          throw new Error("Not logged in!")
      }
    }
    return next();
  };
  