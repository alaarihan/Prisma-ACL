import { createModule, gql } from "graphql-modules";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";

export const AuthModule = createModule({
  id: "Auth",
  typeDefs,
  resolvers,
});
