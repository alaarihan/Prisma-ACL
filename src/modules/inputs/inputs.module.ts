import { createModule, gql } from "graphql-modules";
import { sdlInputs } from "../../../tools/sdlInputsGen";

const userSecretFields = ["password", "verificationToken"];
const excludedFields = [
  {
    names: [
      "UserCreateInput",
      "UserUpdateInput",
      "UserUpdateManyMutationInput",
      "UserScalarFieldEnum",
      "UserMaxAggregateOutputType",
      "UserMinAggregateOutputType",
      "UserCountAggregateOutputType",
      "UserWhereInput",
      "UserOrderByInput",
    ],
    types: ["enum", "aggregate", "input"],
    fields: userSecretFields,
  },
];
export const InputsModule = createModule({
  id: "Inputs",
  typeDefs: sdlInputs({
    doNotUseFieldUpdateOperationsInput: true,
    exclude: excludedFields,
  }),
});
