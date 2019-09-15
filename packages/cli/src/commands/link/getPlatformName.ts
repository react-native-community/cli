const names: {[key: string]: string} = {
  ios: 'iOS',
  android: 'Android',
};

export default function getPlatformName(name: string): string {
  return names[name] || name;
}
