/**
 * @flow
 */

const names = {
  ios: 'iOS',
  android: 'Android',
};

export default function getPlatformName(name: string) {
  return names[name] || name;
}
