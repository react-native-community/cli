const CODEGEN_NATIVE_COMPONENT_REGEX = /codegenNativeComponent(<.*>)?\s*\(\s*["'`](\w+)["'`](,?[\s\S]+interfaceOnly:\s*(\w+))?/m;

export function extractComponentDescriptors(contents: string) {
  const match = contents.match(CODEGEN_NATIVE_COMPONENT_REGEX);
  if (!(match?.[4] === 'true') && match?.[2]) {
    return `${match[2]}ComponentDescriptor`;
  }
  return null;
}
