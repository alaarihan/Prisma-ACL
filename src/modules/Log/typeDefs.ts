import { gql } from "graphql-modules";

export default gql`
  type Log {
    id: Int!
    operation: String
    message: String
    ip: String!
    host: String!
    userAgent: String!
    authorId: Int
    referer: String
    createdAt: DateTime!
  }

  extend type User {
    logs(
      where: LogWhereInput
      orderBy: LogOrderByInput
      cursor: LogWhereUniqueInput
      take: Int
      skip: Int
      distinct: LogScalarFieldEnum
    ): [Log!]!
  }

  extend type Query {
    findUniqueLog(where: LogWhereUniqueInput!): Log
    findFirstLog(
      where: LogWhereInput
      orderBy: [LogOrderByInput!]
      cursor: LogWhereUniqueInput
      distinct: LogScalarFieldEnum
      skip: Int
      take: Int
    ): Log
    findManyLog(
      where: LogWhereInput
      orderBy: [LogOrderByInput!]
      cursor: LogWhereUniqueInput
      distinct: LogScalarFieldEnum
      skip: Int
      take: Int
    ): [Log!]
    findManyLogCount(
      where: LogWhereInput
      orderBy: [LogOrderByInput!]
      cursor: LogWhereUniqueInput
      distinct: LogScalarFieldEnum
      skip: Int
      take: Int
    ): Int!
    aggregateLog(
      where: LogWhereInput
      orderBy: [LogOrderByInput!]
      cursor: LogWhereUniqueInput
      distinct: LogScalarFieldEnum
      skip: Int
      take: Int
    ): AggregateLog
  }
  extend type Mutation {
    createOneLog(data: LogCreateInput!): Log!
    updateOneLog(where: LogWhereUniqueInput!, data: LogUpdateInput!): Log!
    deleteOneLog(where: LogWhereUniqueInput!): Log
    upsertOneLog(
      where: LogWhereUniqueInput!
      create: LogCreateInput!
      update: LogUpdateInput!
    ): Log
    deleteManyLog(where: LogWhereInput): BatchPayload
    updateManyLog(
      where: LogWhereInput
      data: LogUpdateManyMutationInput
    ): BatchPayload
  }
`;
