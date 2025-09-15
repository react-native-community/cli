import ruby, {output} from '../ruby';

//
// Mocks
//
const mockExeca = jest.fn();
jest.mock('execa', () => ({
  execa: mockExeca,
}));

const mockLogger = jest.fn();
jest.mock('@react-native-community/cli-tools', () => ({
  findProjectRoot: () => '.',
  logger: {
    warn: mockLogger,
  },
}));

jest.mock('../../versionRanges', () => ({
  RUBY: '>= 1.0.0',
}));

//
// Placeholder Values
//
const Languages = {
  Ruby: {version: '1.0.0'},
};

const runRubyGetDiagnostic = () => {
  // @ts-ignore
  return ruby.getDiagnostics({Languages});
};

const Gemfile = {
  noGemfile: {code: 1},
  noRuby: {code: 'ENOENT'},
  ok: {stdout: output.OK},
  unknown: (err: Error) => err,
  wrongRuby: (stderr: string) => ({code: 2, stderr}),
};

//
// Tests
//

describe('ruby', () => {
  beforeEach(() => {
    mockLogger.mockClear();
    mockExeca.mockClear();
  });

  describe('Gemfile', () => {
    it('validates the environment', async () => {
      mockExeca.mockResolvedValueOnce(Gemfile.ok);

      expect(await runRubyGetDiagnostic()).toMatchObject({
        needsToBeFixed: false,
      });
    });

    it('fails to find ruby to run the script', async () => {
      mockExeca.mockRejectedValueOnce(Gemfile.noRuby);

      const resp = await runRubyGetDiagnostic();
      expect(resp.needsToBeFixed).toEqual(true);
      expect(resp.description).toMatch(/Ruby/i);
    });

    it('fails to find the Gemfile and messages the user', async () => {
      mockExeca.mockRejectedValueOnce(Gemfile.noGemfile);

      const {description} = await runRubyGetDiagnostic();
      expect(description).toMatch(/could not find/i);
    });

    it('fails because the wrong version of ruby is installed', async () => {
      const stderr = '>= 3.2.0, < 3.2.0';
      mockExeca.mockRejectedValueOnce(Gemfile.wrongRuby(stderr));

      expect(await runRubyGetDiagnostic()).toMatchObject({
        needsToBeFixed: true,
        versionRange: stderr,
      });
    });

    it('fails for unknown reasons, so we skip it but log', async () => {
      const error = Error('Something bad went wrong');
      mockExeca.mockRejectedValueOnce(Gemfile.unknown(error));

      await runRubyGetDiagnostic();
      expect(mockLogger).toBeCalledTimes(1);
      expect(mockLogger).toBeCalledWith(error.message);
    });

    it('uses are static ruby versions builtin into doctor if no Gemfile', async () => {
      mockExeca.mockRejectedValueOnce(new Error('Meh'));
      expect(await runRubyGetDiagnostic()).toMatchObject({
        needsToBeFixed: false,
        version: Languages.Ruby.version,
        versionRange: '>= 1.0.0',
      });
    });
  });
});
