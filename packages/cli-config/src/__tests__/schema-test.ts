import {projectConfig} from '../schema';

test.each([
  ['the entire config is omitted', undefined],
  ['the config is empty', {}],
  ['the project key is omitted', {dependencies: {}}],
  ['the project config is empty', {project: {}}],
])('applies nested platform defaults when %s', (_description, config) => {
  const {error, value} = projectConfig.validate(config);

  expect(error).toBeUndefined();
  expect(value.project).toEqual({
    android: {assets: []},
    ios: {assets: [], automaticPodsInstallation: true},
  });
});

test('preserves an explicit automatic CocoaPods installation opt-out', () => {
  const {error, value} = projectConfig.validate({
    project: {ios: {automaticPodsInstallation: false}},
  });

  expect(error).toBeUndefined();
  expect(value.project.ios.automaticPodsInstallation).toBe(false);
});
