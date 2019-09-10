type names = {[key: string]: string};
const names: names = {
  ios: 'iOS',
  android: 'Android',
};

export const getPlatformName = (name: string): string => names[name] || name;
