import { gql } from 'graphql-modules'

export default gql`
  type Post {
    id: Int!
    authorId: Int
    name: String!
    content: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type User {
    posts(
      where: PostWhereInput
      orderBy: PostOrderByInput
      cursor: PostWhereUniqueInput
      take: Int
      skip: Int
      distinct: PostScalarFieldEnum
    ): [Post!]!
  }

  extend type Category {
    posts(
      where: PostWhereInput
      orderBy: PostOrderByInput
      cursor: PostWhereUniqueInput
      take: Int
      skip: Int
      distinct: PostScalarFieldEnum
    ): [Post!]!
  }

  extend type Query {
    findUniquePost(where: PostWhereUniqueInput!): Post
    findFirstPost(
      where: PostWhereInput
      orderBy: [PostOrderByInput!]
      cursor: PostWhereUniqueInput
      distinct: PostScalarFieldEnum
      skip: Int
      take: Int
    ): Post
    findManyPost(
      where: PostWhereInput
      orderBy: [PostOrderByInput!]
      cursor: PostWhereUniqueInput
      distinct: PostScalarFieldEnum
      skip: Int
      take: Int
    ): [Post!]
    findManyPostCount(
      where: PostWhereInput
      orderBy: [PostOrderByInput!]
      cursor: PostWhereUniqueInput
      distinct: PostScalarFieldEnum
      skip: Int
      take: Int
    ): Int!
    aggregatePost(
      where: PostWhereInput
      orderBy: [PostOrderByInput!]
      cursor: PostWhereUniqueInput
      distinct: PostScalarFieldEnum
      skip: Int
      take: Int
    ): AggregatePost
  }
  extend type Mutation {
    createOnePost(data: PostCreateInput!): Post!
    updateOnePost(where: PostWhereUniqueInput!, data: PostUpdateInput!): Post!
    deleteOnePost(where: PostWhereUniqueInput!): Post
    upsertOnePost(
      where: PostWhereUniqueInput!
      create: PostCreateInput!
      update: PostUpdateInput!
    ): Post
    deleteManyPost(where: PostWhereInput): BatchPayload
    updateManyPost(
      where: PostWhereInput
      data: PostUpdateManyMutationInput
    ): BatchPayload
  }
`
