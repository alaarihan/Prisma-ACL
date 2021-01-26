import { createModule } from 'graphql-modules'
import typeDefs from './typeDefs'
import resolvers from './resolvers'

export const CategoryModule = createModule({
  id: 'Category',
  typeDefs,
  resolvers,
})
