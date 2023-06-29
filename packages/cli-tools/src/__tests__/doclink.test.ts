import * as link from '../doclink';

const mockPlatform = jest.fn().mockReturnValue('darwin');
jest.mock('os', () => ({
  platform: mockPlatform,
}));

describe('link', () => {
  it('builds a link with the platform and os defined', () => {
    mockPlatform.mockReturnValueOnce('darwin');
    link.setPlatform('android');

    const url = new URL(link.docs('environment-setup', 'inherit')).toString();
    expect(url).toMatch(/os=macos/);
    expect(url).toMatch(/platform=android/);
    expect(url).toEqual(
      expect.stringContaining('https://reactnative.dev/docs/environment-setup'),
    );

    // Handles a change of os
    mockPlatform.mockReturnValueOnce('win32');
    expect(link.docs('environment-setup', 'inherit')).toMatch(/os=windows/);

    // Handles a change of platform
    link.setPlatform('ios');
    expect(link.docs('environment-setup', 'inherit')).toMatch(/platform=ios/);

    // Handles cases where we don't need a platform
    expect(link.blog('2019/11/18/react-native-doctor', 'none')).not.toMatch(
      /platform=/,
    );
  });

  it('preserves anchor-links', () => {
    expect(link.docs('environment-setup', 'inherit', 'ruby')).toMatch(/#ruby/);
  });

  describe('overrides', () => {
    afterAll(() => link.setVersion(null));
    it.each([
      [{hash: 'ruby'}, /#ruby/],
      [{hash: 'ruby', os: 'linux'}, /os=linux/],
      [{'extra stuff': 'here?ok'}, /extra\+stuff=here%3Fok/],
    ])("link.doc('environment-setup, %o) -> %o", (param, re) => {
      expect(link.docs('environment-setup', 'none', param)).toMatch(re);
    });
  });

  describe('enforces platform inheritance', () => {
    it("asserts on not setting the platform for link.docs('foo', 'inherit')", () => {
      link.setPlatform(null);
      expect(() => {
        link.docs('foobar', 'inherit');
      }).toThrow(/link\.setPlatform/);
    });
  });

  describe('versions', () => {
    afterAll(() => link.setVersion(null));
    it('supports linking to a specific version of React Native', () => {
      link.setVersion('0.71');
      expect(link.docs('environment-setup', 'ios', 'ruby')).toEqual(
        expect.stringContaining(
          'https://reactnative.dev/docs/0.71/environment-setup',
        ),
      );
    });
  });
});
