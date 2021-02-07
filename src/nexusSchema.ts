import { makeSchema } from 'nexus'
import * as types from './graphql'
import { nexusPrisma } from 'nexus-plugin-prisma'
import { paljs } from '@paljs/nexus'
import { join } from 'path'

export const schema = makeSchema({
  types,
  plugins: [
    paljs({ doNotUseFieldUpdateOperationsInput: true }),
    nexusPrisma({
      experimentalCRUD: true,
      paginationStrategy: 'prisma',
      atomicOperations: false,
    }),
  ],
  outputs: {
    schema: __dirname + '/generated/schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: join(__dirname, 'context.ts'),
    export: 'Context',
  },
})
