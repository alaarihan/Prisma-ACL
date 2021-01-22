import { createModule, gql } from "graphql-modules";
import { sdlInputs } from "../../../tools/sdlInputsGen";

const userSecretFields = ["password", "verificationToken"];
const excludedFields = [
  {
    name: "UserWhereInput",
    fields: userSecretFields,
  },
  {
    name: "UserOrderByInput",
    fields: userSecretFields,
  },
  {
    name: "UserCreateInput",
    fields: ['verificationToken'],
  },
  {
    name: "UserUpdateInput",
    fields: ['verificationToken'],
  },
  {
    name: "UserUpdateManyMutationInput",
    fields: ['verificationToken'],
  },
];
export const InputsModule = createModule({
  id: "Inputs",
  typeDefs: sdlInputs({
    doNotUseFieldUpdateOperationsInput: true,
    exclude: excludedFields,
  }),
});
