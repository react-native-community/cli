import {extractComponentDescriptors} from '../extractComponentDescriptors';

test('extracts TestComponentComponentDescriptor from basic fixture', () => {
  const fixture =
    "export default (codegenNativeComponent<NativeProps>('TestComponent'): ComponentType);";
  expect(extractComponentDescriptors(fixture)).toEqual(
    'TestComponentComponentDescriptor',
  );
});

test('extracts TestComponentComponentDescriptor from when untyped', () => {
  const fixture = "export default codegenNativeComponent('TestComponent')";
  expect(extractComponentDescriptors(fixture)).toEqual(
    'TestComponentComponentDescriptor',
  );
});

test('extracts TestComponentComponentDescriptor from when options are passed', () => {
  const fixture = `export default (codegenNativeComponent<NativeProps>('TestComponent', {
    abc: d
  }): ComponentType);`;
  expect(extractComponentDescriptors(fixture)).toEqual(
    'TestComponentComponentDescriptor',
  );
});

test('extracts TestComponentComponentDescriptor from when options are passed 2', () => {
  const fixture =
    "export default (codegenNativeComponent<NativeProps>('TestComponent', {abc: d}): ComponentType);";
  expect(extractComponentDescriptors(fixture)).toEqual(
    'TestComponentComponentDescriptor',
  );
});

test('extracts TestComponentComponentDescriptor from when options are passed empty', () => {
  const fixture =
    "export default (codegenNativeComponent<NativeProps>('TestComponent', {}): ComponentType);";
  expect(extractComponentDescriptors(fixture)).toEqual(
    'TestComponentComponentDescriptor',
  );
});

test('skip when interfaceOnly is true', () => {
  const fixture = `export default (codegenNativeComponent<NativeProps>('TestComponent', {
    interfaceOnly: true,
    abc: d
  }): ComponentType);`;
  expect(extractComponentDescriptors(fixture)).toBeNull();
});

test('skip when interfaceOnly is true 2', () => {
  const fixture = `export default (codegenNativeComponent<NativeProps>('TestComponent', {
    abc: d,
    interfaceOnly: true,
  }): ComponentType);`;
  expect(extractComponentDescriptors(fixture)).toBeNull();
});
