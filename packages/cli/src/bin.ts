#!/usr/bin/env node

import './tools/gracefulifyFs';
import semver from 'semver';
import execa from 'execa';
import chalk from 'chalk';

const nodeVersion = execa.sync('node', ['--version'], {}).stdout;

if (semver.satisfies(nodeVersion, '>=14')) {
  const {run} = require('./');
  run();
} else {
  console.error(`${chalk.red('You need at least Node 14 to run CLI.')}`);
}
