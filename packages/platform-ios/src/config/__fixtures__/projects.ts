// @ts-ignore FIXME: Add global types for jest
const path = jest.requireActual('path');
// @ts-ignore
const fs = jest.requireActual('fs');

const ios = {
  'demoProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(
      path.join(__dirname, './files/project.pbxproj'),
    ),
  },
};

const iosPod = {
  'demoProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(
      path.join(__dirname, './files/project.pbxproj'),
    ),
  },
  'TestPod.podspec': 'empty',
};

export const flat = {
  ios,
};

export const nested = {
  ios,
};

export const withExamples = {
  Examples: flat,
  ios,
};

export const withPods = {
  Podfile: 'content',
  ios: iosPod,
};

export const withoutPods = {
  ios,
};
