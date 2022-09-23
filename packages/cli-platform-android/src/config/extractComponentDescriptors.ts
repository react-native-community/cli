// TODO: avoid the regex and improve reliability by reading this data from codegen schema.json.
// Need to find a way to run "generateNewArchitectureFiles" gradle task after each library's "generateCodegenSchemaFromJavaScript" task.
const CODEGEN_NATIVE_COMPONENT_REGEX = /codegenNativeComponent(<.*>)?\s*\(\s*["'`](\w+)["'`](,?[\s\S]+interfaceOnly:\s*(\w+))?/m;

export function extractComponentDescriptors(contents: string) {
  const match = contents.match(CODEGEN_NATIVE_COMPONENT_REGEX);
  if (!(match?.[4] === 'true') && match?.[2]) {
    return `${match[2]}ComponentDescriptor`;
  }
  return null;
}
