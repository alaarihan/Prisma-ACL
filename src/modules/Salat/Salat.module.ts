import { createModule } from 'graphql-modules'
import typeDefs from './typeDefs'
import resolvers from './resolvers'

export const SalatModule = createModule({
  id: 'Salat',
  typeDefs,
  resolvers,
})
