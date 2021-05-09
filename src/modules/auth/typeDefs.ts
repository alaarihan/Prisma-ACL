import { gql } from "graphql-modules";

export default gql`
  type Query {
    me: User
  }
  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    signup(
      firstName: String
      lastName: String
      email: String!
      password: String!
      country: String
      dateOfBirth: DateTime
    ): AuthPayload!
    verifyUserEmail(email: String, token: String!): Boolean!
    forgotPassword(email: String): Boolean!
    resetUserPassword(
      email: String
      token: String!
      password: String!
    ): Boolean!
  }
  type AuthPayload {
    token: String!
    user: User
  }
`;
