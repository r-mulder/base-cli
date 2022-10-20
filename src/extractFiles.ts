import fs from 'node:fs';
import os from 'node:os';
import jszip from 'jszip';

import { updatePackageJson } from './updatePackageJson';

const fsp = fs.promises;

const filePath = os.tmpdir() + '/base-cli/repo.zip';

const cleanup = (): Promise<void> =>
  fsp.rm(os.tmpdir() + '/base-cli/', { recursive: true, force: true });

export const extractFiles = async (name: string): Promise<void> => {
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
