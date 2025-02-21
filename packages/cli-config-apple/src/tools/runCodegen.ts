import fs from 'fs';
import path from 'path';
import execa from 'execa';

interface CodegenOptions {
  root: string;
  platform: string;
}

async function runCodegen(options: CodegenOptions): Promise<void> {
  if (fs.existsSync('build')) {
    fs.rmSync('build', {recursive: true});
  }

  const reactNativePath = path.dirname(
    require.resolve('react-native', {paths: [process.cwd()]}),
  );
  const codegenScript = path.join(
    reactNativePath,
    'scripts',
    'generate-codegen-artifacts.js',
  );

  await execa('node', [
    codegenScript,
    '-p',
    options.root,
    '-o',
    process.cwd(),
    '-t',
    options.platform,
  ]);
}

export default runCodegen;
