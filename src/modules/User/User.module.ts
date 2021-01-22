import { createModule } from 'graphql-modules'
import typeDefs from './typeDefs'
import resolvers from './resolvers'
import { userMutationsMiddleware } from "../../middlewares/userMutationsMiddleware";

export const UserModule = createModule({
  id: 'User',
  typeDefs,
  resolvers,
  middlewares: {
    "Mutation": {
      "*": [userMutationsMiddleware]
    }
  }
})
