const names: {[key: string]: string} = {
  ios: 'iOS',
  android: 'Android',
};

export const getPlatformName = (name: string): string => names[name] || name;
