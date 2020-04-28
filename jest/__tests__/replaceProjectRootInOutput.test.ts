import {replaceProjectRootInOutput} from '../helpers';

test('should replace project root in output with <<REPLACED_ROOT>> value', () => {
  const cwd = '/var/folders/zt/917v0jxx6lg3p_zfh9s_02bm0000gn/T/';
  const output = `{
    "root": "/private${cwd}/test_root/TestProject",
  }`;
  const outputWithReplacedProjectRoot = `{
    "root": "<<REPLACED_ROOT>>/test_root/TestProject",
  }`;
  expect(replaceProjectRootInOutput(output, cwd)).toBe(
    outputWithReplacedProjectRoot,
  );
});
