import findManifest from '../findManifest';
import getMainActivity from '../getMainActivity';
import * as mocks from '../__fixtures__/android';

jest.mock('path');
jest.mock('fs');

const fs = require('fs');

describe('android::getMainActivity', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      valid: {
        android: {
          app: mocks.valid,
        },
      },
      className: {
        android: {
          app: mocks.className,
        },
      },
      few: {
        android: {
          app: mocks.fewActivities,
        },
      },
    });
  });

  it('returns main activity if file exists in the folder', () => {
    const manifestPath = findManifest('/valid');
    const manifest = getMainActivity(manifestPath || '');
    expect(manifest).not.toBeNull();
    expect(typeof manifest).toBe('string');
    expect(manifest).toBe('.MainActivity');
  });

  it('returns main activity if there is few activities', () => {
    const manifestPath = findManifest('/few');
    const mainActivity = getMainActivity(manifestPath || '');
    expect(mainActivity).not.toBeNull();
    expect(typeof mainActivity).toBe('string');
    expect(mainActivity).toBe('.ExampleAppActivity');
  });

  it('returns main activity if it is class name', () => {
    const manifestPath = findManifest('/className');
    const mainActivity = getMainActivity(manifestPath || '');
    expect(mainActivity).not.toBeNull();
    expect(typeof mainActivity).toBe('string');
    expect(mainActivity).toBe('com.example.ExampleAppActivity');
  });

  it('returns null if file do not exist', () => {
    const fakeManifestPath = findManifest('/empty');
    expect(getMainActivity(fakeManifestPath || '')).toBeNull();
  });
});
