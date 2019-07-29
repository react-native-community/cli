import * as android from './android';

export const flat = {
  android: android.valid,
};

export const nested = {
  android: {
    app: android.valid,
  },
};

export const withExamples = {
  Examples: flat,
  android: android.valid,
};
