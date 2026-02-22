import path from 'path';
import {
  cleanup,
  getTempDirectory,
  writeFiles,
} from '../../../../../jest/helpers';
import getArchitecture from '../getArchitecture';

const DIR = getTempDirectory('get_architecture_test');

beforeEach(() => {
  cleanup(DIR);
});

describe('getArchitecture', () => {
  it('returns undefined when Pods project does not exist', async () => {
    const result = await getArchitecture(path.join(DIR, 'ios'));

    expect(result).toBeUndefined();
  });

  it('returns true when Pods project is configured with new architecture', async () => {
    writeFiles(DIR, {
      'ios/Pods/Pods.xcodeproj/project.pbxproj': '-DRCT_NEW_ARCH_ENABLED=1',
    });

    const result = await getArchitecture(path.join(DIR, 'ios'));

    expect(result).toBe(true);
  });

  it('returns false when Pods project does not include new architecture flag', async () => {
    writeFiles(DIR, {
      'ios/Pods/Pods.xcodeproj/project.pbxproj': 'SOME_OTHER_FLAG=1',
    });

    const result = await getArchitecture(path.join(DIR, 'ios'));

    expect(result).toBe(false);
  });
});
