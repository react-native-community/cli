import findLocalModules from '../findLocalModules';

jest.mock('fs');
jest.mock('path');

const fs = require('fs');

describe('findLocalModules', () => {
  beforeAll(() => {
    fs.__setMockFilesystem({
      empty: {},
      fewModules: {
        'package.json': '{}',
        local_modules: {
          module1: {
            'package.json': JSON.stringify({name: 'module1'}),
          },
          module2: {
            'package.json': JSON.stringify({name: 'module2'}),
          },
        },
      },
    });
  });

  it('returns empty object if local_modules folder does not exist', () => {
    expect(findLocalModules('/')).toEqual({});
  });

  it('returns modules object with root if local_modules folder contains modules', () => {
    expect(findLocalModules('/fewModules')).toEqual({
      module1: {
        root: '/fewModules/local_modules/module1',
      },
      module2: {
        root: '/fewModules/local_modules/module2',
      },
    });
  });
});
