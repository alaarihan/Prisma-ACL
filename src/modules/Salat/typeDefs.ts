import { gql } from 'graphql-modules'

export default gql`
  type Salat {
    id: Int!
    authorId: Int
    name: SalatName!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type User {
    salawat(
      where: SalatWhereInput
      orderBy: SalatOrderByInput
      cursor: SalatWhereUniqueInput
      take: Int
      skip: Int
      distinct: SalatScalarFieldEnum
    ): [Salat!]!
  }

  extend type Query {
    findUniqueSalat(where: SalatWhereUniqueInput!): Salat
    findFirstSalat(
      where: SalatWhereInput
      orderBy: [SalatOrderByInput!]
      cursor: SalatWhereUniqueInput
      distinct: SalatScalarFieldEnum
      skip: Int
      take: Int
    ): Salat
    findManySalat(
      where: SalatWhereInput
      orderBy: [SalatOrderByInput!]
      cursor: SalatWhereUniqueInput
      distinct: SalatScalarFieldEnum
      skip: Int
      take: Int
    ): [Salat!]
    findManySalatCount(
      where: SalatWhereInput
      orderBy: [SalatOrderByInput!]
      cursor: SalatWhereUniqueInput
      distinct: SalatScalarFieldEnum
      skip: Int
      take: Int
    ): Int!
    aggregateSalat(
      where: SalatWhereInput
      orderBy: [SalatOrderByInput!]
      cursor: SalatWhereUniqueInput
      distinct: SalatScalarFieldEnum
      skip: Int
      take: Int
    ): AggregateSalat
  }
  extend type Mutation {
    createOneSalat(data: SalatCreateInput!): Salat!
    updateOneSalat(
      where: SalatWhereUniqueInput!
      data: SalatUpdateInput!
    ): Salat!
    deleteOneSalat(where: SalatWhereUniqueInput!): Salat
    upsertOneSalat(
      where: SalatWhereUniqueInput!
      create: SalatCreateInput!
      update: SalatUpdateInput!
    ): Salat
    deleteManySalat(where: SalatWhereInput): BatchPayload
    updateManySalat(
      where: SalatWhereInput
      data: SalatUpdateManyMutationInput
    ): BatchPayload
  }
`
