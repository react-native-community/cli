import execa from 'execa';
import path from 'path';
import {build} from '..';

jest.mock('execa');

describe('build', () => {
  it('runs gradlew.bat by its full path on Windows', () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', {value: 'win32'});
    const chdir = jest.spyOn(process, 'chdir').mockImplementation(() => {});
    try {
      build(['assembleDebug'], 'sourceDir');
    } finally {
      Object.defineProperty(process, 'platform', platform);
      chdir.mockRestore();
    }

    expect(execa.sync).toHaveBeenLastCalledWith(
      path.join('sourceDir', 'gradlew.bat'),
      ['assembleDebug'],
      {stdio: 'inherit', cwd: 'sourceDir'},
    );
  });
});
