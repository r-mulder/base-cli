#!/usr/bin/env node
import { program } from 'commander';
import fs from 'node:fs';

import { getRepo } from './getRepo';

const repoUrl = 'https://github.com/code-capi/base/zipball/main';

program
  .argument('<string>', 'name of the project')
  .action((name: string): void => {
    const exists = fs.existsSync(name);

    if (exists) {
      console.log('Directory already exists');
    } else if (name) {
      getRepo(repoUrl, name);
    } else {
      console.log('No name was provided');
    }
  });

program.parse();
