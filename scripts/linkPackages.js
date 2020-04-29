const execa = require('execa');
const chalk = require('chalk');
const path = require('path');
const glob = require('glob');

const projects = glob
  .sync('packages/*/package.json')
  // We don't want to deal with global-cli at the moment
  .filter((name) => !name.includes('global-cli'));

projects.forEach((project) => {
  const cwd = path.dirname(project);
  console.log(chalk.dim(`Running "yarn link" in ${cwd}`));
  execa.sync('yarn', ['link'], {cwd, stdio: 'inherit'});
});
