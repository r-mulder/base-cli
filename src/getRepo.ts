import fs from 'node:fs';
import os from 'node:os';
import https from 'node:https';

import { extractFiles } from './extractFiles';

const fsp = fs.promises;

export const getRepo = async (url: string, name: string): Promise<void> => {
  const filePath = os.tmpdir() + '/base-cli/repo.zip';

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
