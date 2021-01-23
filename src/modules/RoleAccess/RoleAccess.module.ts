import { createModule } from 'graphql-modules'
import typeDefs from './typeDefs'
import resolvers from './resolvers'

export const RoleAccessModule = createModule({
  id: 'RoleAccess',
  typeDefs,
  resolvers,
})
