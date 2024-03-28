import type FS from 'fs';
import type Path from 'path';

const fs = jest.requireActual<typeof FS>('fs');
const path = jest.requireActual<typeof Path>('path');

const fixtureFilePaths = {
  mainApplicationKotlin:
    'android/app/src/main/java/com/example/MainApplication.kt',
  mainApplicationJava:
    'android/app/src/main/java/com/example/MainApplication.java',
  infoPlist: 'ios/Example/Info.plist',
  projectPbxproj: 'ios/Example.xcodeproj/project.pbxproj',
  latoBoldFont: 'assets/android/fonts/Lato-Bold.ttf',
  latoBoldItalicFont: 'assets/android/fonts/Lato-BoldItalic.ttf',
  montserratRegularFont: 'assets/android/fonts/Montserrat-Regular.ttf',
  ralewayRegularFont: 'assets/ios/fonts/Raleway-Regular.ttf',
  firaCodeBoldFont: 'assets/shared/fonts/FiraCode-Bold.otf',
  firaCodeRegularFont: 'assets/shared/fonts/FiraCode-Regular.otf',
  latoRegularFont: 'assets/shared/fonts/Lato-Regular.ttf',
  latoLightFont: 'assets/shared/fonts/Lato-Light.ttf',
  documentPdf: 'assets/shared/TestSample Document.pdf',
  imageGif: 'assets/shared/GIF Image.gif',
  imageJpg: 'assets/shared/JPG Image.jpg',
  imagePng: 'assets/shared/PNG Image.png',
  soundMp3: 'assets/shared/MP3 Sound (1).mp3',
} as const;

const fixtureFiles = {
  mainApplicationKotlin: fs.readFileSync(
    path.join(__dirname, './files/MainApplication.kt'),
  ),
  mainApplicationJava: fs.readFileSync(
    path.join(__dirname, './files/MainApplication.java'),
  ),
  infoPlist: fs.readFileSync(path.join(__dirname, './files/Info.plist')),
  projectPbxproj: fs.readFileSync(
    path.join(__dirname, './files/project.pbxproj'),
  ),
  latoBoldFont: fs.readFileSync(path.join(__dirname, './files/Lato-Bold.ttf')),
  latoBoldItalicFont: fs.readFileSync(
    path.join(__dirname, './files/Lato-BoldItalic.ttf'),
  ),
  montserratRegularFont: fs.readFileSync(
    path.join(__dirname, './files/Montserrat-Regular.ttf'),
  ),
  ralewayRegularFont: fs.readFileSync(
    path.join(__dirname, './files/Raleway-Regular.ttf'),
  ),
  firaCodeBoldFont: fs.readFileSync(
    path.join(__dirname, './files/FiraCode-Bold.otf'),
  ),
  firaCodeRegularFont: fs.readFileSync(
    path.join(__dirname, './files/FiraCode-Regular.otf'),
  ),
  latoRegularFont: fs.readFileSync(
    path.join(__dirname, './files/Lato-Regular.ttf'),
  ),
  latoLightFont: fs.readFileSync(
    path.join(__dirname, './files/Lato-Light.ttf'),
  ),
  documentPdf: fs.readFileSync(
    path.join(__dirname, './files/TestSample Document.pdf'),
  ),
  imageGif: fs.readFileSync(path.join(__dirname, './files/GIF Image.gif')),
  imageJpg: fs.readFileSync(path.join(__dirname, './files/JPG Image.jpg')),
  imagePng: fs.readFileSync(path.join(__dirname, './files/PNG Image.png')),
  soundMp3: fs.readFileSync(path.join(__dirname, './files/MP3 Sound (1).mp3')),
} as const;

const baseProject = {
  // iOS project
  [fixtureFilePaths.infoPlist]: fixtureFiles.infoPlist,
  [fixtureFilePaths.projectPbxproj]: fixtureFiles.projectPbxproj,

  // Assets folder
  [fixtureFilePaths.latoBoldFont]: fixtureFiles.latoBoldFont,
  [fixtureFilePaths.latoBoldItalicFont]: fixtureFiles.latoBoldItalicFont,
  [fixtureFilePaths.ralewayRegularFont]: fixtureFiles.ralewayRegularFont,
  [fixtureFilePaths.firaCodeBoldFont]: fixtureFiles.firaCodeBoldFont,
  [fixtureFilePaths.firaCodeRegularFont]: fixtureFiles.firaCodeRegularFont,
  [fixtureFilePaths.latoRegularFont]: fixtureFiles.latoRegularFont,
  [fixtureFilePaths.documentPdf]: fixtureFiles.documentPdf,
  [fixtureFilePaths.imageGif]: fixtureFiles.imageGif,
  [fixtureFilePaths.imageJpg]: fixtureFiles.imageJpg,
  [fixtureFilePaths.imagePng]: fixtureFiles.imagePng,
  [fixtureFilePaths.soundMp3]: fixtureFiles.soundMp3,
} as const;

const baseProjectKotlin = {
  ...baseProject,

  // Android project
  [fixtureFilePaths.mainApplicationKotlin]: fixtureFiles.mainApplicationKotlin,
} as const;

const baseProjectJava = {
  ...baseProject,

  // Android project
  [fixtureFilePaths.mainApplicationJava]: fixtureFiles.mainApplicationJava,
} as const;

export {fixtureFilePaths, fixtureFiles, baseProjectKotlin, baseProjectJava};
