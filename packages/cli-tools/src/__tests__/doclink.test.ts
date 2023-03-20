import * as link from '../doclink';

const mockPlatform = jest.fn().mockReturnValue('darwin');
jest.mock('os', () => ({
  platform: mockPlatform,
}));

describe('link', () => {
  it('builds a link with the platform and os defined', () => {
    mockPlatform.mockReturnValueOnce('darwin');
    link.setPlatform('android');

    const url = new URL(link.docs('environment-setup')).toString();
    expect(url).toMatch(/os=macos/);
    expect(url).toMatch(/platform=android/);
    expect(url).toEqual(
      expect.stringContaining('https://reactnative.dev/docs/environment-setup'),
    );

    // Handles a change of os
    mockPlatform.mockReturnValueOnce('win32');
    expect(link.docs('environment-setup')).toMatch(/os=windows/);

    // Handles a change of platform
    link.setPlatform('ios');
    expect(link.docs('environment-setup')).toMatch(/platform=ios/);
  });

  it('preserves anchor-links', () => {
    expect(link.docs('environment-setup', 'ruby')).toMatch(/#ruby/);
  });

  describe('overrides', () => {
    afterAll(() => link.setVersion(null));
    it.each([
      [{hash: 'ruby'}, /#ruby/],
      [{hash: 'ruby', os: 'linux'}, /os=linux/],
      [{platform: 'ios'}, /platform=ios/],
      [{'extra stuff': 'here?ok'}, /extra\+stuff=here%3Fok/],
    ])("link.doc('environment-setup, %o) -> %o", (param, re) => {
      expect(link.docs('environment-setup', param)).toMatch(re);
    });
  });

  describe('versions', () => {
    afterAll(() => link.setVersion(null));
    it('supports linking to a specific version of React Native', () => {
      link.setVersion('0.71');
      expect(link.docs('environment-setup', 'ruby')).toEqual(
        expect.stringContaining(
          'https://reactnative.dev/docs/0.71/environment-setup',
        ),
      );
    });
  });
});
