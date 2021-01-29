import { schema as defaultSchema, DMMF } from "./schema";
import gql from "graphql-tag";
import { GraphQLSchema, printSchema } from "graphql";
import { writeFileSync } from "fs";

interface OptionsType {
  dmmf?: DMMF.Document;
  doNotUseFieldUpdateOperationsInput?: boolean;
  exclude?: any;
}

const testedTypes: string[] = [];

export const hasEmptyTypeFields = (type: string, options?: OptionsType) => {
  const schema = options?.dmmf?.schema || defaultSchema;
  testedTypes.push(type);
  const inputObjectTypes = schema ? [...schema?.inputObjectTypes.prisma] : [];
  if (schema?.inputObjectTypes.model)
    inputObjectTypes.push(...schema.inputObjectTypes.model);

  const inputType = inputObjectTypes.find((item) => item.name === type);
  if (inputType) {
    if (inputType.fields.length === 0) return true;
    for (const field of inputType.fields) {
      const fieldType = getInputType(field, options);
      if (
        fieldType.type !== type &&
        fieldType.location === "inputObjectTypes" &&
        !testedTypes.includes(fieldType.type as string)
      ) {
        const state = hasEmptyTypeFields(fieldType.type as string);
        if (state) return true;
      }
    }
  }
  return false;
};

export const getInputType = (
  field: DMMF.SchemaArg,
  options?: { doNotUseFieldUpdateOperationsInput?: boolean }
) => {
  let index: number = 0;
  if (
    options?.doNotUseFieldUpdateOperationsInput &&
    field.inputTypes.length > 1 &&
    (field.inputTypes[1].type as string).endsWith("FieldUpdateOperationsInput")
  ) {
    return field.inputTypes[index];
  }
  if (
    field.inputTypes.length > 1 &&
    field.inputTypes[1].location === "inputObjectTypes"
  ) {
    index = 1;
  }
  return field.inputTypes[index];
};

function createInput(options?: OptionsType) {
  const schema = options?.dmmf?.schema || defaultSchema;
  let fileContent = `
  scalar DateTime
  
  type BatchPayload {
  count: Int!
}
`;
  if (schema) {
    const enums = [...schema.enumTypes.prisma];
    if (schema.enumTypes.model) enums.push(...schema.enumTypes.model);
    enums.forEach((item) => {
      const modelExcludedFields = options.exclude.filter(
        (enumItem) =>
          (enumItem.names[0] === "*" || enumItem.names.includes(item.name)) &&
          enumItem.types.includes("enum")
      );
      fileContent += `enum ${item.name} {`;
      item.values.forEach((item2) => {
        if (
          !modelExcludedFields ||
          !modelExcludedFields.find((enumItem2) =>
            enumItem2.fields.includes(item2)
          )
        ) {
          fileContent += `
        ${item2}`;
        }
      });
      fileContent += `}
  
  `;
    });
    const inputObjectTypes = [...schema.inputObjectTypes.prisma];
    if (schema.inputObjectTypes.model)
      inputObjectTypes.push(...schema.inputObjectTypes.model);

    inputObjectTypes.forEach((model) => {
      const modelExcludedFields = options.exclude.filter(
        (item) =>
          (item.names[0] === "*" || item.names.includes(model.name)) &&
          item.types.includes("input")
      );

      if (
        model.fields.length > 0 &&
        model.fields.length > modelExcludedFields.length
      ) {
        fileContent += `input ${model.name} {
      `;
        model.fields.forEach((field) => {
          if (
            !modelExcludedFields ||
            !modelExcludedFields.find((item2) =>
              item2.fields.includes(field.name)
            )
          ) {
            const inputType = getInputType(field, options);
            const hasEmptyType =
              inputType.location === "inputObjectTypes" &&
              hasEmptyTypeFields(inputType.type as string);
            if (!hasEmptyType) {
              fileContent += `${field.name}: ${
                inputType.isList ? `[${inputType.type}!]` : inputType.type
              }${field.isRequired ? "!" : ""}
        `;
            }
          }
        });
        fileContent += `}
    
  `;
      }
    });

    schema?.outputObjectTypes.prisma
      .filter((type) => type.name.includes("Aggregate"))
      .forEach((type) => {
        const modelExcludedFields = options.exclude.filter(
          (item) =>
            (item.names[0] === "*" || item.names.includes(type.name)) &&
            item.types.includes("aggregate")
        );
        fileContent += `type ${type.name} {
      `;
        type.fields.forEach((field) => {
          if (
            !modelExcludedFields ||
            !modelExcludedFields.find((items2) =>
              items2.fields.includes(field.name)
            )
          ) {
            fileContent += `${field.name}: ${
              field.outputType.isList
                ? `[${field.outputType.type}!]`
                : field.outputType.type
            }${field.isRequired ? "!" : ""}
        `;
          }
        });
        fileContent += `}
    
  `;
      });
  }
  return fileContent;
}

export const sdlInputs = (options?: OptionsType) => gql`
  ${createInput(options)}
`;

export const generateGraphQlSDLFile = (
  schema: GraphQLSchema,
  path: string = "schema.graphql"
) => {
  writeFileSync(path, printSchema(schema));
};
