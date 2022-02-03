import findPodfilePath from '../findPodfilePath';
import {logger} from '@react-native-community/cli-tools';
import * as projects from '../__fixtures__/projects';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

afterEach(() => {
  jest.resetAllMocks();
});

describe('ios::findPodfilePath', () => {
  it('returns null if there is no Podfile', () => {
    fs.__setMockFilesystem({});
    expect(findPodfilePath('/')).toBeNull();
  });

  it('returns Podfile path if it exists', () => {
    fs.__setMockFilesystem(projects.project);
    expect(findPodfilePath('/')).toContain('ios/Podfile');
  });

  it('prints a warning when multile Podfiles are found', () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation();
    fs.__setMockFilesystem({
      foo: projects.project,
      bar: projects.project,
    });
    expect(findPodfilePath('/')).toContain('bar/ios/Podfile');
    expect(warn.mock.calls).toMatchSnapshot();
  });

  it('igores Podfiles in Example folder', () => {});
});
