import { gql } from 'graphql-modules'

export default gql`
  type Category {
    id: Int!
    name: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Post {
    categories(
      where: CategoryWhereInput
      orderBy: CategoryOrderByInput
      cursor: CategoryWhereUniqueInput
      take: Int
      skip: Int
      distinct: CategoryScalarFieldEnum
    ): [Category!]!
  }

  extend type Query {
    findUniqueCategory(where: CategoryWhereUniqueInput!): Category
    findFirstCategory(
      where: CategoryWhereInput
      orderBy: [CategoryOrderByInput!]
      cursor: CategoryWhereUniqueInput
      distinct: CategoryScalarFieldEnum
      skip: Int
      take: Int
    ): Category
    findManyCategory(
      where: CategoryWhereInput
      orderBy: [CategoryOrderByInput!]
      cursor: CategoryWhereUniqueInput
      distinct: CategoryScalarFieldEnum
      skip: Int
      take: Int
    ): [Category!]
    findManyCategoryCount(
      where: CategoryWhereInput
      orderBy: [CategoryOrderByInput!]
      cursor: CategoryWhereUniqueInput
      distinct: CategoryScalarFieldEnum
      skip: Int
      take: Int
    ): Int!
    aggregateCategory(
      where: CategoryWhereInput
      orderBy: [CategoryOrderByInput!]
      cursor: CategoryWhereUniqueInput
      distinct: CategoryScalarFieldEnum
      skip: Int
      take: Int
    ): AggregateCategory
  }
  extend type Mutation {
    createOneCategory(data: CategoryCreateInput!): Category!
    updateOneCategory(
      where: CategoryWhereUniqueInput!
      data: CategoryUpdateInput!
    ): Category!
    deleteOneCategory(where: CategoryWhereUniqueInput!): Category
    upsertOneCategory(
      where: CategoryWhereUniqueInput!
      create: CategoryCreateInput!
      update: CategoryUpdateInput!
    ): Category
    deleteManyCategory(where: CategoryWhereInput): BatchPayload
    updateManyCategory(
      where: CategoryWhereInput
      data: CategoryUpdateManyMutationInput
    ): BatchPayload
  }
`
