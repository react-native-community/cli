import {getTemplateVersion} from '../npm';
import assert from 'assert';

let ref: any;

global.fetch = jest.fn();

function fetchReturn(json: any): void {
  assert(global.fetch != null, 'You forgot to backup global.fetch!');
  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve({json: () => Promise.resolve(json)}),
  );
}

describe('getTemplateVersion', () => {
  beforeEach(() => {
    ref = global.fetch;
  });
  afterEach(() => {
    global.fetch = ref;
  });

  it('should order matching versions with the most recent first', async () => {
    const VERSION = '0.75.1';
    fetchReturn({
      versions: {
        '3.2.1': {scripts: {version: VERSION}},
        '1.0.0': {scripts: {version: '0.75.0'}},
        '1.2.3': {scripts: {version: VERSION}},
      },
      time: {
        '3.2.1': '2024-08-15T00:00:00.000Z',
        '1.0.0': '2024-08-15T10:10:10.000Z',
        '1.2.3': '2024-08-16T00:00:00.000Z', // Last published version
      },
    });

    expect(await getTemplateVersion(VERSION)).toEqual('1.2.3');
  });

  it('should NOT match if MAJOR.MINOR.PATCH has no exact match', async () => {
    fetchReturn({
      versions: {
        '3.2.1': {scripts: {version: '0.75.1'}},
        '3.2.2': {scripts: {version: '0.75.2'}},
      },
      time: {
        '3.2.1': '2024-08-15T00:00:00.000Z',
        '3.2.2': '2024-08-16T00:00:00.000Z', // Last published version
      },
    });

    expect(await getTemplateVersion('0.75.3')).toEqual(undefined);
  });

  it('should NOT matching when MAJOR.MINOR is not found', async () => {
    fetchReturn({
      versions: {
        '3.2.1': {scripts: {version: '0.75.1'}},
        '3.2.2': {scripts: {version: '0.75.2'}},
      },
      time: {
        '3.2.1': '2024-08-15T00:00:00.000Z',
        '3.2.2': '2024-08-16T00:00:00.000Z', // Last published version
      },
    });

    expect(await getTemplateVersion('0.76.0')).toEqual(undefined);
  });

  it('ignores packages that have weird script version entries', async () => {
    fetchReturn({
      versions: {
        '1': {},
        '2': {scripts: {}},
        '3': {scripts: {version: 'echo "not a semver entry"'}},
        win: {scripts: {version: '0.75.2'}},
      },
      time: {
        '1': '2024-08-14T00:00:00.000Z',
        win: '2024-08-15T00:00:00.000Z',
        // These would normally both beat '3' on time:
        '2': '2024-08-16T00:00:00.000Z',
        '3': '2024-08-16T00:00:00.000Z',
      },
    });

    expect(await getTemplateVersion('0.75.2')).toEqual('win');
  });

  it('support `version` and `reactNativeVersion` entries from npm', async () => {
    fetchReturn({
      versions: {
        '3.2.1': {scripts: {version: '0.75.1'}},
        '3.2.2': {scripts: {reactNativeVersion: '0.75.2'}},
      },
      time: {
        '3.2.1': '2024-08-15T00:00:00.000Z',
        '3.2.2': '2024-08-16T00:00:00.000Z', // Last published version
      },
    });

    expect(await getTemplateVersion('0.75.2')).toEqual('3.2.2');
  });

  it('prefers `reactNativeVersion` over `version` entries from npm', async () => {
    fetchReturn({
      versions: {
        '3.2.1': {scripts: {version: '0.75.1'}},
        '3.2.2': {
          scripts: {
            reactNativeVersion: '0.75.2',
            version: 'should prefer the other one',
          },
        },
      },
      time: {
        '3.2.1': '2024-08-15T00:00:00.000Z',
        '3.2.2': '2024-08-16T00:00:00.000Z', // Last published version
      },
    });

    expect(await getTemplateVersion('0.75.2')).toEqual('3.2.2');
  });
});
