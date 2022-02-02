// @ts-ignore FIXME: Add global types for jest
const path = jest.requireActual('path');
// @ts-ignore
const fs = jest.requireActual('fs');

export const projectWithPodfileOnly = {
  ios: {},
};

export const project = {
  ios: {
    Podfile: 'content',
    'demoProject.xcodeproj': {
      'project.pbxproj': fs.readFileSync(
        path.join(__dirname, './files/project.pbxproj'),
      ),
    },
  },
};

export const withExamples = {
  ...project,
  Examples: {
    Podfile: 'content',
    'exampleProject.xcodeproj': {
      'project.pbxproj': fs.readFileSync(
        path.join(__dirname, './files/project.pbxproj'),
      ),
    },
  },
};
