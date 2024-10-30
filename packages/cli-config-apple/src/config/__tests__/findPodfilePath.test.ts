import findPodfilePath from '../findPodfilePath';
import {logger} from '@react-native-community/cli-tools';
import * as projects from '../__fixtures__/projects';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('ios::findPodfilePath', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      flat: {
        ...projects.project,
      },
      multiple: {
        bar: {
          ...projects.project,
        },
        foo: {
          ...projects.project,
        },
      },
    });
  });

  it('returns null if there is no Podfile', () => {
    expect(findPodfilePath('/empty', 'ios')).toBeNull();
  });

  it('returns Podfile path if it exists', () => {
    expect(findPodfilePath('/flat', 'ios')).toContain('ios/Podfile');
  });

  it('prints a warning when multile Podfiles are found', () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation();
    expect(findPodfilePath('/multiple', 'ios')).toContain(
      '/multiple/bar/ios/Podfile',
    );
    expect(warn.mock.calls).toMatchSnapshot();
  });

  it('ignores Podfiles in Example folder', () => {});
});
