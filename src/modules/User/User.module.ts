import { createModule } from "graphql-modules";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";
import { userMiddleware } from "../middlewares/user";

export const UserModule = createModule({
  id: "User",
  typeDefs,
  resolvers,
  middlewares: {
    Mutation: {
      "*": [userMiddleware],
    },
  },
});
