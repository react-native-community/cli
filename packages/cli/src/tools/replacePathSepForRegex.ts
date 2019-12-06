import path from 'path';

export default function replacePathSepForRegex(string: string) {
  if (path.sep === '\\') {
    return string.replace(
      /(\/|(.)?\\(?![[\]{}()*+?.^$|\\]))/g,
      (_match, _, p2) => (p2 && p2 !== '\\' ? p2 + '\\\\' : '\\\\'),
    );
  }
  return string;
}
