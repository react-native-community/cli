const execa = require('execa');
const pico = require('picocolors');
const path = require('path');
const glob = require('fast-glob');

const projects = glob.sync('packages/*/package.json');

projects.forEach((project) => {
  const cwd = path.dirname(project);
  console.log(pico.dim(`Running "yarn link" in ${cwd}`));
  execa.sync('yarn', ['link'], {cwd, stdio: 'inherit'});
});
