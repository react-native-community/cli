import path from 'path';
import fs from 'fs';

/**
 Creates a `.yarnrc.yml` file with "nodeLinker: node-module" in passed path to force Yarn to use the `node-modules` linker, because React Native doesn't support the Plug'n'Play node linker.
 */

const addNodeLinker = (root: string) => {
  const yarnrcFileContent = 'nodeLinker: node-modules\n';

  fs.writeFileSync(path.join(root, '.yarnrc.yml'), yarnrcFileContent, {
    encoding: 'utf8',
    flag: 'w',
  });
};

export default addNodeLinker;
