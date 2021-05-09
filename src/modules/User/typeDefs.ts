import { gql } from 'graphql-modules'

export default gql`
  type User {
    id: Int!
    email: String!
    firstName: String
    lastName: String
    role: UserRole!
    country: String
    dateOfBirth: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Log {
    author: User
  }

  extend type Salat {
    author: User
  }

  extend type Post {
    author: User
  }

  extend type Query {
    findUniqueUser(where: UserWhereUniqueInput!): User
    findFirstUser(
      where: UserWhereInput
      orderBy: [UserOrderByInput!]
      cursor: UserWhereUniqueInput
      distinct: UserScalarFieldEnum
      skip: Int
      take: Int
    ): User
    findManyUser(
      where: UserWhereInput
      orderBy: [UserOrderByInput!]
      cursor: UserWhereUniqueInput
      distinct: UserScalarFieldEnum
      skip: Int
      take: Int
    ): [User!]
    findManyUserCount(
      where: UserWhereInput
      orderBy: [UserOrderByInput!]
      cursor: UserWhereUniqueInput
      distinct: UserScalarFieldEnum
      skip: Int
      take: Int
    ): Int!
    aggregateUser(
      where: UserWhereInput
      orderBy: [UserOrderByInput!]
      cursor: UserWhereUniqueInput
      distinct: UserScalarFieldEnum
      skip: Int
      take: Int
    ): AggregateUser
  }
  extend type Mutation {
    createOneUser(data: UserCreateInput!): User!
    updateOneUser(where: UserWhereUniqueInput!, data: UserUpdateInput!): User!
    deleteOneUser(where: UserWhereUniqueInput!): User
    upsertOneUser(
      where: UserWhereUniqueInput!
      create: UserCreateInput!
      update: UserUpdateInput!
    ): User
    deleteManyUser(where: UserWhereInput): BatchPayload
    updateManyUser(
      where: UserWhereInput
      data: UserUpdateManyMutationInput
    ): BatchPayload
  }
`
