import {replaceProjectRootInOutput} from '../jest/helpers';

test('should replace project root in output with <<REPLACED_ROOT>> value', () => {
  const output = `{
    "root": "/private/var/folders/zt/917v0jxx6lg3p_zfh9s_02bm0000gn/T/test_root/TestProject",
  }`;
  const outputWithReplacedProjectRoot = `{
    "root": "<<REPLACED_ROOT>>/test_root/TestProject",
  }`;
  expect(replaceProjectRootInOutput(output, 'test_root')).toBe(
    outputWithReplacedProjectRoot,
  );
});
