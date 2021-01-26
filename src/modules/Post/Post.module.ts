import { createModule } from 'graphql-modules'
import typeDefs from './typeDefs'
import resolvers from './resolvers'

export const PostModule = createModule({
  id: 'Post',
  typeDefs,
  resolvers,
})
