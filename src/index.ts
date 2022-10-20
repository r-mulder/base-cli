#!/usr/bin/env node

import { program } from 'commander';
import jszip from 'jszip';

import fs from 'node:fs';
import os from 'node:os';
import https from 'node:https';

const fsp = fs.promises;

const repoUrl = 'https://github.com/code-capi/base/zipball/main';

const filePath = os.tmpdir() + '/base-cli/repo.zip';

const cleanup = (): Promise<void> =>
  fsp.rm(os.tmpdir() + '/base-cli/', { recursive: true, force: true });

const extractFiles = async (name: string): Promise<void> => {
  const content = fs.readFileSync(filePath);

  const jszipInstance = new jszip();

  const result = await jszipInstance.loadAsync(content);

  const keys = Object.keys(result.files);
  const dir = `./${name}/`;

  fsp
    .mkdir(dir)
    .then(() => {
      keys.forEach(async (key): Promise<void> => {
        const item = result.files[key];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, ...rest] = item.name.split('/');

        const newDir = dir + rest.join('/');

        if (item.dir) {
          fs.mkdirSync(newDir, { recursive: true });
        } else {
          fs.writeFileSync(
            newDir,
            Buffer.from(await item.async('arraybuffer'))
          );
        }
      });
    })
    .then(cleanup)
    .then(() => updatePackageJson(name));
};

const getRepo = async (url: string, name: string): Promise<void> => {
  try {
    await fsp
      .mkdir(os.tmpdir() + '/base-cli', {
        recursive: true,
      })
      .then(() =>
        https.get(url, (res): void => {
          const file = fs.createWriteStream(filePath);
          res.pipe(file);

          const code = res.statusCode ?? 0;

          if (code > 300 && code < 400 && !!res.headers.location) {
            getRepo(res.headers.location, name);
            return;
          }

          file.on('finish', (): void => {
            file.close();
            extractFiles(name);
          });
        })
      );
  } catch (e) {
    console.error(e);
  }
};

const updatePackageJson = async (name: string): Promise<void> => {
  const fileName = `${name}/package.json`;
  const json = JSON.parse(fs.readFileSync(fileName, 'utf8'));
  const newJson = { ...json, name };
  fs.writeFileSync(fileName, Buffer.from(JSON.stringify(newJson)));
};

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
