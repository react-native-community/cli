#!/usr/bin/env node

import './tools/gracefulifyFs';
import semver from 'semver';
import chalk from 'chalk';

if (semver.satisfies(process.version, '>=14')) {
  const {run} = require('./');
  run();
} else {
  console.error(`${chalk.red('You need at least Node 14 to run CLI.')}`);
}
