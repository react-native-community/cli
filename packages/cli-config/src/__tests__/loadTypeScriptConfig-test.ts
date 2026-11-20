import {defaultLoaders, defaultLoadersSync} from 'cosmiconfig';
import {
  loadTypeScriptConfig,
  loadTypeScriptConfigSync,
} from '../loadTypeScriptConfig';

jest.mock('cosmiconfig', () => ({
  defaultLoaders: {'.ts': jest.fn(), '.js': jest.fn()},
  defaultLoadersSync: {'.ts': jest.fn(), '.js': jest.fn()},
}));

const tsLoader = defaultLoaders['.ts'] as jest.Mock;
const jsLoader = defaultLoaders['.js'] as jest.Mock;
const tsLoaderSync = defaultLoadersSync['.ts'] as jest.Mock;
const jsLoaderSync = defaultLoadersSync['.js'] as jest.Mock;

const FILE = '/project/react-native.config.ts';
const config = {assets: ['./fonts']};
const typescript7Error = new TypeError(
  `TypeScript Error in ${FILE}:\ntypescript.findConfigFile is not a function`,
);

function setNativeTypeScript(value: unknown) {
  Object.defineProperty(process.features, 'typescript', {
    value,
    configurable: true,
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  setNativeTypeScript('strip');
});

describe('loadTypeScriptConfig', () => {
  it('uses the typescript loader when it works', async () => {
    tsLoader.mockResolvedValue(config);

    await expect(loadTypeScriptConfig(FILE, '')).resolves.toBe(config);
    expect(jsLoader).not.toHaveBeenCalled();
  });

  it('loads the file natively when typescript has no compiler API', async () => {
    tsLoader.mockRejectedValue(typescript7Error);
    jsLoader.mockResolvedValue(config);

    await expect(loadTypeScriptConfig(FILE, '')).resolves.toBe(config);
    expect(jsLoader).toHaveBeenCalledWith(FILE, '');
  });

  it('does not hide other typescript errors', async () => {
    const syntaxError = new SyntaxError("TypeScript Error: ';' expected");
    tsLoader.mockRejectedValue(syntaxError);

    await expect(loadTypeScriptConfig(FILE, '')).rejects.toBe(syntaxError);
    expect(jsLoader).not.toHaveBeenCalled();
  });

  it('explains what to do when Node cannot load TypeScript', async () => {
    setNativeTypeScript(undefined);
    tsLoader.mockRejectedValue(typescript7Error);
    jsLoader.mockRejectedValue(new SyntaxError('Unexpected token'));

    await expect(loadTypeScriptConfig(FILE, '')).rejects.toThrow(
      /cannot load TypeScript files natively/,
    );
  });

  it('explains that Node does not load TypeScript from node_modules', async () => {
    const nodeModulesError = Object.assign(new Error('unsupported'), {
      code: 'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING',
    });
    tsLoader.mockRejectedValue(typescript7Error);
    jsLoader.mockRejectedValue(nodeModulesError);

    await expect(loadTypeScriptConfig(FILE, '')).rejects.toThrow(
      /does not load TypeScript files from node_modules/,
    );
  });
});

describe('loadTypeScriptConfigSync', () => {
  it('uses the typescript loader when it works', () => {
    tsLoaderSync.mockReturnValue(config);

    expect(loadTypeScriptConfigSync(FILE, '')).toBe(config);
    expect(jsLoaderSync).not.toHaveBeenCalled();
  });

  it('loads the file natively and unwraps the default export', () => {
    tsLoaderSync.mockImplementation(() => {
      throw typescript7Error;
    });
    jsLoaderSync.mockReturnValue({__esModule: true, default: config});

    expect(loadTypeScriptConfigSync(FILE, '')).toBe(config);
  });
});
