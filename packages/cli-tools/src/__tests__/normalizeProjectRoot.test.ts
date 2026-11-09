import normalizeProjectRoot from '../normalizeProjectRoot';

test('leaves a plain posix path untouched', () => {
  expect(normalizeProjectRoot('/Users/me/project')).toBe('/Users/me/project');
});

test('percent-encodes characters that are not valid in a header', () => {
  expect(normalizeProjectRoot('/Users/me/my app')).toBe('/Users/me/my%20app');
  expect(normalizeProjectRoot('/привіт/path')).toBe(
    '/%D0%BF%D1%80%D0%B8%D0%B2%D1%96%D1%82/path',
  );
});

test('converts a windows path to forward slashes', () => {
  expect(normalizeProjectRoot('C:\\Users\\me\\project')).toBe(
    'C:/Users/me/project',
  );
});
