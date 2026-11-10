import tokenize from '../tokenize';

const originalPlatform = process.platform;

function mockPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', {
    value: platform,
    configurable: true,
  });
}

describe('tokenize', () => {
  it('splits space-separated xcodebuild arguments', () => {
    expect(tokenize('-scheme MyApp -configuration Release')).toEqual([
      '-scheme',
      'MyApp',
      '-configuration',
      'Release',
    ]);
  });

  it('splits space-separated gradle properties', () => {
    expect(
      tokenize('-PnewArchEnabled=true -PreactNativeArchitectures=arm64-v8a'),
    ).toEqual([
      '-PnewArchEnabled=true',
      '-PreactNativeArchitectures=arm64-v8a',
    ]);
  });

  it('keeps a double-quoted xcodebuild destination with spaces in one token', () => {
    expect(tokenize('-destination "generic/platform=iOS Simulator"')).toEqual([
      '-destination',
      'generic/platform=iOS Simulator',
    ]);
  });

  it('keeps a single-quoted destination specifier with spaces in one token', () => {
    expect(
      tokenize("-destination 'platform=iOS Simulator,name=iPhone 15'"),
    ).toEqual(['-destination', 'platform=iOS Simulator,name=iPhone 15']);
  });

  it('strips the surrounding quotes from a quoted path containing a space', () => {
    expect(tokenize('-project "My App.xcodeproj"')).toEqual([
      '-project',
      'My App.xcodeproj',
    ]);
  });

  it('joins an unquoted build-setting name with its quoted, space-containing value', () => {
    expect(tokenize('EXCLUDED_ARCHS="arm64 i386"')).toEqual([
      'EXCLUDED_ARCHS=arm64 i386',
    ]);
  });

  it('collapses extra whitespace (spaces and tabs) between arguments', () => {
    expect(tokenize('-scheme   MyApp \t -quiet')).toEqual([
      '-scheme',
      'MyApp',
      '-quiet',
    ]);
  });

  it('passes xcodebuild build-setting syntax such as $(inherited) through verbatim', () => {
    expect(
      tokenize(
        'OTHER_LDFLAGS=$(inherited) GCC_PREPROCESSOR_DEFINITIONS=DEBUG=1',
      ),
    ).toEqual([
      'OTHER_LDFLAGS=$(inherited)',
      'GCC_PREPROCESSOR_DEFINITIONS=DEBUG=1',
    ]);
  });

  it('preserves backslashes inside single quotes so Windows gradle paths survive', () => {
    expect(
      tokenize("-Pandroid.injected.signing.store.file='C:\\keys\\app.jks'"),
    ).toEqual(['-Pandroid.injected.signing.store.file=C:\\keys\\app.jks']);
  });

  it('throws on a lone unquoted apostrophe', () => {
    expect(() => tokenize("-Pmessage=don't")).toThrowError(
      "Unterminated ' quote in: -Pmessage=don't",
    );
  });

  it('parses a quoted Gradle property value containing an apostrophe', () => {
    expect(tokenize(`-Pmessage="It's ready"`)).toEqual([
      "-Pmessage=It's ready",
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('returns an empty array for whitespace-only input', () => {
    expect(tokenize('   \t ')).toEqual([]);
  });

  it('keeps an explicit empty quoted argument', () => {
    expect(tokenize('-quiet ""')).toEqual(['-quiet', '']);
  });

  it('throws on an unterminated double quote', () => {
    expect(() => tokenize('-destination "platform=iOS')).toThrowError(
      'Unterminated " quote in: -destination "platform=iOS',
    );
  });

  it('throws on an unterminated single quote', () => {
    expect(() => tokenize("-destination 'platform=iOS")).toThrowError(
      "Unterminated ' quote in: -destination 'platform=iOS",
    );
  });

  describe('with POSIX backslash escaping (non-Windows)', () => {
    beforeEach(() => mockPlatform('linux'));
    afterEach(() => mockPlatform(originalPlatform));

    it('treats an unquoted backslash as an escape that preserves the next character', () => {
      expect(tokenize('-project My\\ App.xcodeproj')).toEqual([
        '-project',
        'My App.xcodeproj',
      ]);
    });

    it('escapes an apostrophe with a backslash outside quotes', () => {
      expect(tokenize("-Pmessage=don\\'t")).toEqual(["-Pmessage=don't"]);
    });

    it('unescapes quotes inside double-quoted JSON values', () => {
      expect(tokenize(String.raw`-Pconfig="{\"name\":\"My App\"}"`)).toEqual([
        '-Pconfig={"name":"My App"}',
      ]);
    });

    it('keeps backslashes literal inside double-quoted values', () => {
      expect(tokenize(String.raw`-Pdir="C:\Program Files\App"`)).toEqual([
        String.raw`-Pdir=C:\Program Files\App`,
      ]);
    });
  });

  describe('on Windows', () => {
    beforeEach(() => mockPlatform('win32'));
    afterEach(() => mockPlatform(originalPlatform));

    it('keeps unquoted backslashes literal so native paths survive', () => {
      expect(
        tokenize(
          String.raw`-Pandroid.injected.signing.store.file=C:\keys\app.jks`,
        ),
      ).toEqual([
        String.raw`-Pandroid.injected.signing.store.file=C:\keys\app.jks`,
      ]);
    });

    it('keeps backslashes literal inside double-quoted values', () => {
      expect(tokenize(String.raw`-Pdir="C:\Program Files\App"`)).toEqual([
        String.raw`-Pdir=C:\Program Files\App`,
      ]);
    });
  });
});
