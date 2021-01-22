import { createModule } from 'graphql-modules'
import typeDefs from './typeDefs'
import resolvers from './resolvers'

export const LogModule = createModule({
  id: 'Log',
  typeDefs,
  resolvers,
})
