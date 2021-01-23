import { gql } from 'graphql-modules'

export default gql`
  type RoleAccess {
    id: Int!
    role: UserRole!
    type: String!
    create: Boolean!
    read: Permission!
    update: Permission!
    delete: Permission!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  extend type Query {
    findUniqueRoleAccess(
      where: RoleAccessWhereUniqueInput!
    ): RoleAccess
    findFirstRoleAccess(
      where: RoleAccessWhereInput
      orderBy: [RoleAccessOrderByInput!]
      cursor: RoleAccessWhereUniqueInput
      distinct: RoleAccessScalarFieldEnum
      skip: Int
      take: Int
    ): RoleAccess
    findManyRoleAccess(
      where: RoleAccessWhereInput
      orderBy: [RoleAccessOrderByInput!]
      cursor: RoleAccessWhereUniqueInput
      distinct: RoleAccessScalarFieldEnum
      skip: Int
      take: Int
    ): [RoleAccess!]
    findManyRoleAccessCount(
      where: RoleAccessWhereInput
      orderBy: [RoleAccessOrderByInput!]
      cursor: RoleAccessWhereUniqueInput
      distinct: RoleAccessScalarFieldEnum
      skip: Int
      take: Int
    ): Int!
    aggregateRoleAccess(
      where: RoleAccessWhereInput
      orderBy: [RoleAccessOrderByInput!]
      cursor: RoleAccessWhereUniqueInput
      distinct: RoleAccessScalarFieldEnum
      skip: Int
      take: Int
    ): AggregateRoleAccess
  }
  extend type Mutation {
    createOneRoleAccess(
      data: RoleAccessCreateInput!
    ): RoleAccess!
    updateOneRoleAccess(
      where: RoleAccessWhereUniqueInput!
      data: RoleAccessUpdateInput!
    ): RoleAccess!
    deleteOneRoleAccess(
      where: RoleAccessWhereUniqueInput!
    ): RoleAccess
    upsertOneRoleAccess(
      where: RoleAccessWhereUniqueInput!
      create: RoleAccessCreateInput!
      update: RoleAccessUpdateInput!
    ): RoleAccess
    deleteManyRoleAccess(where: RoleAccessWhereInput): BatchPayload
    updateManyRoleAccess(
      where: RoleAccessWhereInput
      data: RoleAccessUpdateManyMutationInput
    ): BatchPayload
  }
`
