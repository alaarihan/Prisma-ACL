import { createModule } from "graphql-modules";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { passHashMiddleware } from "../../middlewares/passHash";

export const UserModule = createModule({
  id: "User",
  typeDefs,
  resolvers,
  middlewares: {
    Mutation: {
      "*": [passHashMiddleware],
    },
  },
});
