const execa = require('execa');
const chalk = require('chalk');
const path = require('path');
const fg = require('fast-glob');

const projects = fg.sync('packages/*/package.json');

projects.forEach((project) => {
  const cwd = path.dirname(project);
  console.log(chalk.dim(`Running "yarn link" in ${cwd}`));
  execa.sync('yarn', ['link'], {cwd, stdio: 'inherit'});
});
