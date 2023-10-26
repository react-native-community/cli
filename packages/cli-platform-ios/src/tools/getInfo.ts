import execa from 'execa';
import {IosInfo} from '../types';

export function getInfo(): IosInfo | undefined {
  try {
    const value = JSON.parse(
      execa.sync('xcodebuild', ['-list', '-json']).stdout,
    );

    if ('project' in value) {
      return value.project;
    } else if ('workspace' in value) {
      return value.workspace;
    }

    return undefined;
  } catch (error) {
    if (
      (error as Error)?.message &&
      (error as Error).message.includes('xcodebuild: error:')
    ) {
      const match = (error as Error).message.match(/xcodebuild: error: (.*)/);
      const err = match ? match[0] : error;
      throw new Error(err as any);
    }
    throw new Error(error as any);
  }
}
