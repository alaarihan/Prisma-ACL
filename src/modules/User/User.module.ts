import { createModule } from 'graphql-modules'
import typeDefs from './typeDefs'
import resolvers from './resolvers'

export const UserModule = createModule({
  id: 'User',
  typeDefs,
  resolvers,
})
